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

    const result = Buffer.concat(await readBucketStream<Buffer>(file)).toString();

    await Redis.set(fileName, result, {
        EX: 3 * 60 * 60,
    });

    return result;
};

export const getClusterStatus = async (clusterId: Snowflake) => {
    return ((await Redis.get(RedisKeys.CLUSTER_STATUS(clusterId))) ?? "uncached") as ClusterStatus;
};

export const getAllTestcases: (c: Cluster) => Promise<TestcaseWithData[]> = async (
    cluster: Cluster
) => {
    if (cluster.status !== "ready") {
        throw new SafeError(StatusCodes.INTERNAL_SERVER_ERROR);
    }

    const testcases = await Database.selectFrom("testcases", "*", {
        cluster_id: cluster.id,
    });

    if (testcases.some((testcase) => !testcase.input_file || !testcase.output_file)) {
        throw new SafeError(StatusCodes.INTERNAL_SERVER_ERROR);
    }

    const testcaseInputByTestcaseId: Record<string, string> = {};
    const testcaseOutputByTestcaseId: Record<string, string> = {};

    await Promise.all(
        testcases.map(async (testcase) => {
            testcaseInputByTestcaseId[testcase.id.toString()] = await fetchTestcaseFile(
                testcase.input_file!
            );
            testcaseOutputByTestcaseId[testcase.id.toString()] = await fetchTestcaseFile(
                testcase.output_file!
            );
        })
    );

    return testcases.map((testcase) => ({
        ...testcase,
        input: testcaseInputByTestcaseId[testcase.id.toString()],
        correct_output: testcaseOutputByTestcaseId[testcase.id.toString()],
    }));
};

type TestcaseWithInput = Testcase & {
    input: string;
};

type TestcaseAssureResult =
    | {
          type: "success";
      }
    | {
          type: "error";
          error: string;
      };

// eslint-disable-next-line sonarjs/cognitive-complexity
export const generateInputs = async (testcases: Testcase[]) => {
    if (testcases.some((t) => t.input_type === "manual")) {
        throw new SafeError(StatusCodes.INTERNAL_SERVER_ERROR);
    }

    const testcaseById: Record<string, Testcase> = {};

    for (const testcase of testcases) {
        testcaseById[testcase.id.toString()] = testcase;
    }

    const testcasesByGeneratorId: Record<string, Testcase[]> = {};

    for (const testcase of testcases) {
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

    await Promise.all(
        generationResults.flat().map(async (result) => {
            if (result.type === "error") {
                await Database.update(
                    "testcases",
                    // eslint-disable-next-line sonarjs/no-duplicate-string
                    { status: "generator-error", error: result.error },
                    { id: result.id }
                );

                return;
            }

            const testcase = testcaseById[result.id.toString()];

            if (!testcase) {
                throw new SafeError(StatusCodes.INTERNAL_SERVER_ERROR);
            }

            const cluster = await Database.selectOneFrom("clusters", ["problem_id"], {
                id: testcase.cluster_id,
            });

            if (!cluster) throw new SafeError(StatusCodes.INTERNAL_SERVER_ERROR);

            const problem = await Database.selectOneFrom("problems", ["title"], {
                id: cluster.problem_id,
            });

            if (!problem) throw new SafeError(StatusCodes.INTERNAL_SERVER_ERROR);

            const inputFilePath = `${problem}/${testcase.cluster_id}/${
                testcase.id
            }-${generateSnowflake()}.in`;

            await S3Client.putObject(Globals.s3.buckets.testcases, inputFilePath, result.output);

            await Database.update("testcases", { input_file: inputFilePath }, { id: testcase.id });
        })
    );
};

type ProblemMeta = {
    solution_language: EvaluationLanguage;
    solution_code: string;
};

export const generateOutputs = async (testcases: Testcase[], problemMeta: ProblemMeta) => {
    if (testcases.some((testCase) => !testCase.input_file)) {
        throw new SafeError(StatusCodes.INTERNAL_SERVER_ERROR);
    }

    if (testcases.some((testCase) => testCase.output_file === "manual")) {
        throw new SafeError(StatusCodes.INTERNAL_SERVER_ERROR);
    }

    const inputByTestcaseId: Record<string, string> = {};

    await Promise.all(
        testcases.map(async (testCase) => {
            inputByTestcaseId[testCase.id.toString()] = await fetchTestcaseFile(
                testCase.input_file!
            );
        })
    );

    const testcasesById: Record<string, Testcase> = {};

    for (const testcase of testcases) {
        testcasesById[testcase.id.toString()] = testcase;
    }

    const [rawOutData, error] = await splitAndEvaluateTestcases(
        {
            problemId: 0n,
            language: problemMeta.solution_language,
            code: problemMeta.solution_code,
            evaluator: IGNORE_OUTPUT_CHECKER,
            evaluation_variant: "checker",
            evaluator_language: "cpp",
            legacy_evaluation: false,
        },
        testcases.map((testcase) => ({
            id: testcase.id,
            input: inputByTestcaseId[testcase.id.toString()],
            correct_output: "",
        })),
        {
            time_limit_millis: 30_000,
            memory_limit_megabytes: 2048,
        }
    );

    if (!rawOutData) {
        throw new SafeError(StatusCodes.INTERNAL_SERVER_ERROR, error?.message);
    }

    await Promise.all(
        rawOutData.map(async (result) => {
            if (result.type !== "success" || result.verdict !== "accepted") {
                await Database.update(
                    "testcases",
                    { status: "solution-error", error: result.verdict },
                    { id: BigInt(result.testCaseId) }
                );

                return;
            }

            const testcase = testcasesById[result.testCaseId];

            if (!testcase) {
                throw new SafeError(StatusCodes.INTERNAL_SERVER_ERROR);
            }

            const cluster = await Database.selectOneFrom("clusters", ["problem_id"], {
                id: testcase.cluster_id,
            });

            if (!cluster) throw new SafeError(StatusCodes.INTERNAL_SERVER_ERROR);

            const problem = await Database.selectOneFrom("problems", ["title"], {
                id: cluster.problem_id,
            });

            if (!problem) throw new SafeError(StatusCodes.INTERNAL_SERVER_ERROR);

            const outputFilePath = `${problem}/${testcase.cluster_id}/${
                testcase.id
            }-${generateSnowflake()}.out`;

            await S3Client.putObject(
                Globals.s3.buckets.testcases,
                outputFilePath,
                result.output ?? ""
            );

            await Database.update(
                "testcases",
                { output_file: outputFilePath },
                { id: testcase.id }
            );
        })
    );
};
