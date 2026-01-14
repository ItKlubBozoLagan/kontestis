import { Cluster, EvaluationLanguage, Testcase, TestcaseWithData } from "@kontestis/models";
import { StatusCodes } from "http-status-codes";
import { eqIn } from "scyllo";

import { Database } from "../database/Database";
import { SafeError } from "../errors/SafeError";
import { Globals } from "../globals";
import { Redis } from "../redis/Redis";
import { S3Client } from "../s3/S3";
import { readBucketStream } from "../utils/stream";
import { EvaluationInputTestcase, ProblemDetails, splitAndEvaluateTestcases } from "./evaluation";
import { generateTestcases, IGNORE_OUTPUT_CHECKER } from "./generator";
import { Logger } from "./logger";
import { generateSnowflake } from "./snowflake";

// eslint-disable-next-line sonarjs/no-duplicate-string
const TESTCASE_STATUS_GENERATOR_ERROR = "generator-error" as const;
// eslint-disable-next-line sonarjs/no-duplicate-string
const TESTCASE_STATUS_SOLUTION_ERROR = "solution-error" as const;

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

export const getAllTestcases: (c: Cluster) => Promise<TestcaseWithData[]> = async (
    cluster: Cluster
) => {
    if (!(await assureClusterGeneration(cluster))) {
        Logger.info("Cluster generation failed or timed out");

        return [];
    }

    const testcases = await Database.selectFrom("testcases", "*", {
        cluster_id: cluster.id,
    });

    if (testcases.some((testcase) => !testcase.input_file || !testcase.output_file)) {
        Logger.error("Testcase input or output file missing after generation");

        return [];
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

type TestcaseAssureResult =
    | {
          type: "success";
      }
    | {
          type: "error";
          error: string;
      };

export const assureTestcaseInput: (
    testcases: Testcase[],
    problemDetails: Pick<ProblemDetails, "problemId">
    // eslint-disable-next-line sonarjs/cognitive-complexity
) => Promise<TestcaseAssureResult> = async (testcases, problemDetails) => {
    const notReadyTestcases = testcases.filter((t) => t.status !== "ready");

    if (notReadyTestcases.some((t) => t.input_type === "manual" && !t.input_file))
        return {
            type: "error",
            error: "Testcase input set up manual but no file uploaded!",
        };

    const generatorTestcases = notReadyTestcases.filter((t) => t.input_type === "generator");

    if (generatorTestcases.some((t) => !t.generator_id))
        return {
            type: "error",
            error: "Testcase input set up to be generated but no generator provided!",
        };

    const testcaseById: Record<string, Testcase> = {};
    const testcaseOrderById: Record<string, number> = {};

    const sortedTestcases = [...testcases].sort((a, b) => Number(a.id - b.id));

    for (const [index, testcase] of sortedTestcases.entries()) {
        testcaseById[testcase.id.toString()] = testcase;
        testcaseOrderById[testcase.id.toString()] = index + 1;
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
    const errorTestcases: Array<{ testcaseNumber: number; generatorInput: string; error: string }> =
        [];

    await Promise.all(
        generationResults.flat().map(async (result) => {
            if (result.type === "error") {
                const testcase = testcaseById[result.id.toString()];
                const testcaseNumber = testcaseOrderById[result.id.toString()];

                errorTestcases.push({
                    testcaseNumber: testcaseNumber,
                    generatorInput: testcase?.generator_input ?? "unknown",
                    error: result.error,
                });

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

            const inputFilePath = `${problemDetails.problemId}/${testcase.cluster_id}/${
                testcase.id
            }-${generateSnowflake()}.in`;

            await S3Client.putObject(Globals.s3.buckets.testcases, inputFilePath, result.output);

            testcaseInputsByTestcaseId[result.id.toString()] = result.output;

            await Redis.set(inputFilePath, result.output, {
                EX: 3 * 60 * 60,
            });

            await Database.update("testcases", { input_file: inputFilePath }, { id: testcase.id });
        })
    );

    if (errorTestcases.length > 0) {
        errorTestcases.sort((a, b) => a.testcaseNumber - b.testcaseNumber);

        const errorMessage = `Generator failed for ${
            errorTestcases.length
        } testcase(s):\n${errorTestcases
            .map(
                (errorTestcase) =>
                    `  - Testcase #${errorTestcase.testcaseNumber} (input "${errorTestcase.generatorInput}"): ${errorTestcase.error}`
            )
            .join("\n")}`;

        return {
            type: "error",
            error: errorMessage,
        };
    }

    return {
        type: "success",
    };
};

type SolutionInfo = {
    solution_language: EvaluationLanguage;
    solution_code: string;
};

export const assureTestcaseOutput: (
    testcases: Testcase[],
    solutionInfo: SolutionInfo,
    problemDetails: Pick<ProblemDetails, "problemId">
    // eslint-disable-next-line sonarjs/cognitive-complexity
) => Promise<TestcaseAssureResult> = async (testcases, solutionInfo, problemDetails) => {
    // Filter out testcases that are already ready OR have errors (from generator phase)
    const notReadyTestcases = testcases.filter(
        (t) =>
            t.status !== "ready" &&
            t.status !== "generator-error" &&
            t.status !== "solution-error" &&
            t.status !== "validation-error"
    );

    if (notReadyTestcases.some((t) => t.output_type === "manual" && !t.output_file))
        return {
            type: "error",
            error: "Testcase output set up manual but no file uploaded!",
        };

    const solutionTestcases = notReadyTestcases.filter((t) => t.output_type === "auto");

    const solutionTestcasesWithInput: EvaluationInputTestcase[] = await Promise.all(
        solutionTestcases.map(async (t) => {
            if (!t.input_file) {
                Logger.error("Testcase input file not found for testcase " + t.id);
                throw new SafeError(StatusCodes.INTERNAL_SERVER_ERROR);
            }

            const input = await fetchTestcaseFile(t.input_file);

            return {
                ...t,
                input,
                correct_output: "",
            };
        })
    );

    const testcaseById: Record<string, Testcase> = {};
    const testcaseOrderById: Record<string, number> = {};

    const sortedAllTestcases = [...testcases].sort((a, b) => Number(a.id - b.id));

    for (const [index, testcase] of sortedAllTestcases.entries()) {
        testcaseOrderById[testcase.id.toString()] = index + 1;
    }

    for (const testcase of notReadyTestcases) {
        testcaseById[testcase.id.toString()] = testcase;
    }

    const [result, error] = await splitAndEvaluateTestcases(
        {
            problemId: 0n,
            language: solutionInfo.solution_language,
            code: Buffer.from(solutionInfo.solution_code ?? "", "utf8").toString("base64"),
            evaluation_variant: "checker",
            evaluator: IGNORE_OUTPUT_CHECKER,
            evaluator_language: "cpp",
            legacy_evaluation: false,
        },
        solutionTestcasesWithInput,
        {
            time_limit_millis: 60_000,
            memory_limit_megabytes: 2048,
        },
        true
    );

    if (!result) {
        Logger.error(`Solution evaluation error: ${error}`);

        return {
            type: "error",
            error: `System error during solution evaluation: ${error?.message ?? "Unknown error"}`,
        };
    }

    const errorTestcases: Array<{
        testcaseNumber: number;
        generatorInput: string;
        verdict: string;
        error?: string;
    }> = [];

    for (const evaluationResult of result) {
        if (evaluationResult.type !== "success" || evaluationResult.verdict !== "accepted") {
            const testcase = testcaseById[evaluationResult.testCaseId];
            const testcaseNumber = testcaseOrderById[evaluationResult.testCaseId];
            const errorMessage =
                evaluationResult.verdict === "compilation_error"
                    ? evaluationResult.compiler_output ?? "Compilation Error"
                    : evaluationResult.verdict === "runtime_error"
                    ? evaluationResult.error
                    : "Solution Error";

            errorTestcases.push({
                testcaseNumber: testcaseNumber,
                generatorInput: testcase?.generator_input ?? "unknown",
                verdict: evaluationResult.verdict,
                error: errorMessage,
            });

            await Database.update(
                "testcases",
                {
                    status: "solution-error",
                    error: `Verdict: ${evaluationResult.verdict} - ${errorMessage}`,
                },
                { id: BigInt(evaluationResult.testCaseId) }
            );
            continue;
        }

        const testcase = testcaseById[evaluationResult.testCaseId];

        if (!testcase) {
            Logger.error(`Testcase not found for id ${evaluationResult.testCaseId}`);
            throw new SafeError(StatusCodes.INTERNAL_SERVER_ERROR);
        }

        const outputFilePath = `${problemDetails.problemId}/${testcase.cluster_id}/${
            testcase.id
        }-${generateSnowflake()}.out`;

        await S3Client.putObject(
            Globals.s3.buckets.testcases,
            outputFilePath,
            evaluationResult.output ?? ""
        );

        await Redis.set(outputFilePath, evaluationResult.output ?? "", { EX: 24 * 60 * 60 });

        await Database.update(
            "testcases",
            { output_file: outputFilePath, status: "ready", error: "" },
            { id: testcase.id }
        );
    }

    if (errorTestcases.length > 0) {
        errorTestcases.sort((a, b) => a.testcaseNumber - b.testcaseNumber);

        const errorMessage = `Solution failed for ${
            errorTestcases.length
        } testcase(s):\n${errorTestcases
            .map((errorTestcase) => {
                let message = `  - Testcase #${errorTestcase.testcaseNumber} (input "${errorTestcase.generatorInput}"): ${errorTestcase.verdict}`;

                if (errorTestcase.error) {
                    message += `\n    ${errorTestcase.error.split("\n").join("\n    ")}`;
                }

                return message;
            })
            .join("\n")}`;

        return {
            type: "error",
            error: errorMessage,
        };
    }

    return {
        type: "success",
        error: "",
    };
};

export const assureClusterGeneration: (cluster: Cluster) => Promise<boolean> = async (
    cluster: Cluster
) => {
    if (cluster.status === "ready") return true;

    await Database.update("clusters", { status: "pending" }, { id: cluster.id });

    const problem = await Database.selectOneFrom("problems", "*", {
        id: cluster.problem_id,
    });

    if (!problem) {
        Logger.error(
            `Found no problem for cluster ${cluster.id} while attempting cluster generation`
        );

        return false;
    }

    const testcases = await Database.selectFrom("testcases", "*", {
        cluster_id: cluster.id,
    });

    const assureInputResult = await assureTestcaseInput(testcases, {
        problemId: problem.id,
    });

    if (assureInputResult.type !== "success") {
        await Database.update(
            "clusters",
            { status: TESTCASE_STATUS_GENERATOR_ERROR, error: assureInputResult.error },
            { id: cluster.id }
        );

        Logger.debug(
            `Cluster ${cluster.id} generation failed on input: ${assureInputResult.error}`
        );

        return false;
    }

    const updatedTestcases = await Database.selectFrom("testcases", "*", {
        cluster_id: cluster.id,
    });

    const assureOutputResult = await assureTestcaseOutput(
        updatedTestcases,
        {
            solution_code: problem.solution_code,
            solution_language: problem.solution_language,
        },
        { problemId: problem.id }
    );

    if (assureOutputResult.type !== "success") {
        await Database.update(
            "clusters",
            { status: TESTCASE_STATUS_SOLUTION_ERROR, error: assureOutputResult.error },
            { id: cluster.id }
        );

        Logger.debug(
            `Cluster ${cluster.id} generation failed on output: ${assureOutputResult.error}`
        );

        return false;
    }

    await Database.update("clusters", { status: "ready", error: "" }, { id: cluster.id });

    return true;
};
