import {
    Cluster,
    ClusterStatus,
    EvaluationLanguage,
    Snowflake,
    Testcase,
    TestcaseWithData,
} from "@kontestis/models";
import { StatusCodes } from "http-status-codes";
import { eqIn } from "scyllo";

import { Database } from "../database/Database";
import { SafeError } from "../errors/SafeError";
import { Globals } from "../globals";
import { Redis } from "../redis/Redis";
import { RedisKeys } from "../redis/RedisKeys";
import { S3Client } from "../s3/S3";
import { R } from "../utils/remeda";
import { readBucketStream } from "../utils/stream";
import { splitAndEvaluateTestcases } from "./evaluation";
import { generateTestcases, IGNORE_OUTPUT_CHECKER } from "./generator";
import { generateSnowflake } from "./snowflake";

const RETURN_OUTPUT_EVALUATOR = `
#include <iostream>
#include <string>
#include <sstream>

// Disable synchronization between C and C++ standard streams
static const auto disable_sync = []() {
    std::ios_base::sync_with_stdio(false);
    std::cin.tie(nullptr);
    return 0;
}();

std::string read_until(const std::string& separator) {
    std::stringstream out;
    std::string line;
    while (true) {
        std::getline(std::cin, line);
        if (line == separator) {
            return out.str();
        }
        out << line << "\\n";
    }
}

int main() {
    std::string separator;
    while (true) {
        std::getline(std::cin, separator);
        if (!separator.empty() && separator.find_first_not_of(' ') != std::string::npos) {
            break;
        }
    }

    read_until(separator);
    std::string out = read_until(separator);
    std::string subOut = read_until(separator);

    std::cout << "custom:" << subOut << std::endl;

    return 0;
}
`;

const fetchTestcaseFile = async (fileName: string) => {
    const cachedFile = await Redis.get(fileName);

    if (cachedFile) {
        return cachedFile;
    }

    const file = await S3Client.getObject(Globals.s3.buckets.testcases, fileName);

    const result = ((await readBucketStream(file)) as string[]).join("");

    await Redis.set(fileName, result, {
        EX: 3 * 60 * 60,
    });

    return result;
};

export const getTestcaseInputData: (testcase: Testcase) => Promise<TestcaseWithInput> = (
    testcase: Testcase
) => {};

export const getClusterStatus = async (clusterId: Snowflake) => {
    return ((await Redis.get(RedisKeys.CLUSTER_STATUS(clusterId))) ?? "uncached") as ClusterStatus;
};

export const getAllTestcases: (c: Cluster) => Promise<TestcaseWithData[]> = async (
    cluster: Cluster
) => {
    if (cluster.mode !== "manual") {
        if (!cluster.auto_generator_id) {
            throw new SafeError(StatusCodes.INTERNAL_SERVER_ERROR);
        }

        const generator = await Database.selectFrom("generators", "*", {
            id: cluster.auto_generator_id,
        });

        if (!generator) {
            throw new SafeError(StatusCodes.INTERNAL_SERVER_ERROR);
        }
    }

    const testcases = await Database.selectFrom("testcases", "*", {
        cluster_id: cluster.id,
    });

    return Promise.all(testcases.map((t) => getTestcaseData(t)));
};

export const assureTestcaseGeneration = async (cluster: Cluster) => {
    const testcases = await Database.selectFrom("testcases", "*", {
        cluster_id: cluster.id,
    });

    if (!(await assureTestcaseInput(testcases))) {
        return false;
    }
};

type TestcaseWithInput = Testcase & {
    input: string;
};

type TestcaseAssureInputResult = {
    type: "success";
    data: TestcaseWithInput[];
} & {
    type: "error";
    error: string;
};

export const getAllTestcaseInputs: (
    testcases: Testcase[]
) => Promise<TestcaseAssureInputResult> = async (testcases: Testcase[]) => {
    const notReadyTestcases = testcases.filter((t) => t.status !== "ready");

    if (notReadyTestcases.some((t) => t.input_type === "manual" && !t.input_file))
        return {
            type: "error",
            error: "manual-input",
        };

    // eslint-disable-next-line sonarjs/no-duplicate-string
    if (notReadyTestcases.some((t) => t.status === "generator-error"))
        return {
            type: "error",
            error: "generator-error",
        };

    const generatorTestcases = notReadyTestcases.filter((t) => t.input_type === "generator");

    const testcaseById: Record<string, Testcase> = {};

    for (const testcase of testcases) {
        testcaseById[testcase.id.toString()] = testcase;
    }

    const testcasesByGeneratorId: Record<string, Testcase[]> = {};

    for (const testcase of generatorTestcases) {
        if (!testcase.generator_id) {
            throw new SafeError(StatusCodes.INTERNAL_SERVER_ERROR);
        }

        if (!testcasesByGeneratorId[testcase.generator_id.toString()]) {
            testcasesByGeneratorId[testcase.generator_id.toString()] = [];
        }

        testcasesByGeneratorId[testcase.generator_id.toString()].push(testcase);
    }

    const generatorIds = Object.keys(testcasesByGeneratorId);

    const generators = await Database.selectFrom("generators", "*", {
        id: eqIn(...generatorIds),
    });

    const generationResults = await Promise.all(
        generators.map((generator) =>
            generateTestcases(
                generator,
                testcasesByGeneratorId[generator.id.toString()].map((t) => ({
                    id: t.id,
                    input: t.generator_input ?? "",
                }))
            )
        )
    );

    const testcaseInputsByTestcaseId: Record<string, string> = {};

    await Promise.all(
        generationResults.flat().map(async (result) => {
            if (result.type === "error") {
                await Database.update(
                    "testcases",
                    { status: "generator-error", error: result.error },
                    { id: result.id }
                );

                return;
            }

            const testcase = testcaseById[result.id.toString()];

            if (!testcase) {
                throw new SafeError(StatusCodes.INTERNAL_SERVER_ERROR);
            }

            // TODO: Problem title in name
            const inputFilePath = `$DD/${testcase.cluster_id}/${
                testcase.id
            }-${generateSnowflake()}.in`;

            await S3Client.putObject(Globals.s3.buckets.testcases, inputFilePath, result.output);

            testcaseInputsByTestcaseId[result.id.toString()] = result.output;

            await Redis.set(
                RedisKeys.CACHED_TESTCASE_INPUT(testcase.cluster_id, testcase.id),
                result.output,
                {
                    EX: 24 * 60 * 60,
                }
            );

            await Database.update("testcases", { input_file: inputFilePath }, { id: testcase.id });
        })
    );

    if (generationResults.flat().some((result) => result.type === "error"))
        return {
            type: "error",
            error: "generator-error",
        };

    const manualInputs = testcases.filter((t) => t.input_type === "manual");

    if (manualInputs.some((t) => t.status !== "ready" || !t.input_file)) {
        return {
            type: "error",
            error: "manual-input",
        };
    }
};

type SolutionInfo = {
    code: string;
    language: EvaluationLanguage;
};

export const assureTestcaseOutput = async (testcases: Testcase[], solutionInfo: SolutionInfo) => {
    const notReadyTestcases = testcases.filter((t) => t.status !== "ready");

    if (notReadyTestcases.some((t) => t.output_type === "manual" && !t.output_file)) return false;

    if (
        notReadyTestcases.some(
            (t) => t.status === "validation-error" || t.status === "solution-error"
        )
    )
        return false;

    const solutionTestcases = notReadyTestcases.filter((t) => t.output_type === "auto");

    const testcaseById: Record<string, Testcase> = {};

    for (const testcase of notReadyTestcases) {
        testcaseById[testcase.id.toString()] = testcase;
    }

    const [result, error] = await splitAndEvaluateTestcases(
        {
            problemId: 0n,
            language: solutionInfo.language,
            code: solutionInfo.code,
            evaluation_variant: "checker",
            evaluator: IGNORE_OUTPUT_CHECKER,
            evaluator_language: "cpp",
            legacy_evaluation: false,
        },
        testcases.map((t) => {})
    );
};

const generateTestcaseInput = async (cluster: Cluster, count: number) => {
    const [data] = await splitAndEvaluateTestcases(
        {
            problemId: 0n,
            language: cluster.generator_language ?? "python",
            code: Buffer.from(cluster.generator_code ?? "", "utf8").toString("base64"),
            evaluator: RETURN_OUTPUT_EVALUATOR,
            evaluation_variant: "checker",
            evaluator_language: "cpp",
            legacy_evaluation: true,
        },
        Array.from({ length: count }).map((_, index) => ({
            id: BigInt(index),
            cluster_id: cluster.id,
            input: index.toString(),
            correct_output: "",
        })),
        {
            time_limit_millis: 60_000,
            memory_limit_megabytes: 2048,
        }
    );

    if (!data) return;

    const inputData: Record<string, string> = {};

    for (const result of data) {
        if (result.type !== "success" || result.verdict !== "custom") {
            return;
        }

        inputData[result.testCaseId] = result.extra;
    }

    return Array.from({ length: count }).map((_, index) => ({
        id: BigInt(index),
        cluster_id: cluster.id,
        input: inputData[index.toString()],
    }));
};

export const generateTestcaseBatch = async (cluster: Cluster, count: number) => {
    await Redis.set(RedisKeys.CLUSTER_STATUS(cluster.id), "pending");

    const testcaseInputs = cluster.generator
        ? await generateTestcaseInput(cluster, count)
        : await Database.selectFrom("testcases", "*", { cluster_id: cluster.id });

    if (!testcaseInputs) {
        return await Redis.set(RedisKeys.CLUSTER_STATUS(cluster.id), "generator_error");
    }

    const problem = await Database.selectOneFrom("problems", "*", { id: cluster.problem_id });

    if (!problem) throw new SafeError(StatusCodes.INTERNAL_SERVER_ERROR);

    const [rawOutData] = await splitAndEvaluateTestcases(
        {
            problemId: problem.id,
            language: problem.solution_language ?? "python",
            code: Buffer.from(problem.solution_code ?? "", "utf8").toString("base64"),
            evaluator: RETURN_OUTPUT_EVALUATOR,
            evaluation_variant:
                problem.evaluation_variant === "output-only" ? "output-only" : "checker",
            evaluator_language: "cpp",
            legacy_evaluation: true,
        },
        R.map(testcaseInputs, (t) => R.addProp(t, "correct_output", "")),
        {
            time_limit_millis: 60_000,
            memory_limit_megabytes: 2048,
        }
    );

    if (!rawOutData) {
        return await Redis.set(RedisKeys.CLUSTER_STATUS(cluster.id), "solution_error");
    }

    const testcases: TestcaseWithData[] = [];

    for (const result of rawOutData) {
        if (result.type !== "success" || result.verdict !== "custom") {
            return await Redis.set(RedisKeys.CLUSTER_STATUS(cluster.id), "solution_error");
        }

        testcases.push({
            id: BigInt(result.testCaseId),
            cluster_id: cluster.id,
            input: testcaseInputs.find((input) => input.id === BigInt(result.testCaseId))!.input,
            correct_output: result.extra,
        });
    }

    await Promise.all(
        testcases.map(async (tc) => {
            await Redis.set(RedisKeys.CACHED_TESTCASE_INPUT(cluster.id, tc.id), tc.input, {
                EX: 3 * 60 * 60,
            });
            await Redis.set(
                RedisKeys.CACHED_TESTCASE_OUTPUT(cluster.id, tc.id),
                tc.correct_output ?? "",
                { EX: 3 * 60 * 60 }
            );
        })
    );

    await Redis.set(RedisKeys.CLUSTER_STATUS(cluster.id), "cached", { EX: 3 * 60 * 60 });

    return testcases;
};
