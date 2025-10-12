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

        return;
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

    if (generationResults.flat().some((result) => result.type === "error"))
        return {
            type: "error",
            error: "generator-error",
        };

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
    const notReadyTestcases = testcases.filter((t) => t.status !== "ready");

    if (notReadyTestcases.some((t) => t.output_type === "manual" && !t.output_file))
        return {
            type: "error",
            error: "Testcase output set up manual but no file uploaded!",
        };

    /*
    if (
        notReadyTestcases.some(
            // eslint-disable-next-line sonarjs/no-duplicate-string
            (t) => t.status === "validation-error" || t.status === "solution-error"
        )
    )
        return {
            type: "error",
            error: "validation-error-or-solution-error",
        };*/

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

    for (const testcase of notReadyTestcases) {
        testcaseById[testcase.id.toString()] = testcase;
    }

    const [result, error] = await splitAndEvaluateTestcases(
        {
            problemId: 0n,
            language: solutionInfo.solution_language,
            // TODO: Fix base64
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
        }
    );

    if (!result) {
        Logger.error(`Solution evaluation error: ${error}`);

        return {
            type: "error",
            error: "system-error",
        };
    }

    let processedSuccessfully = true;

    for (const evaluationResult of result) {
        if (evaluationResult.type !== "success" || evaluationResult.verdict !== "accepted") {
            await Database.update(
                "testcases",
                // eslint-disable-next-line sonarjs/no-duplicate-string
                { status: "solution-error", error: "Solution error" },
                { id: BigInt(evaluationResult.testCaseId) }
            );
            processedSuccessfully = false;
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

    return {
        type: processedSuccessfully ? "success" : "error",
        error: processedSuccessfully ? "" : "solution-error",
    };
};

export const assureClusterGeneration: (cluster: Cluster) => Promise<boolean> = async (
    cluster: Cluster
) => {
    if (cluster.status === "ready") return true;

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
            { status: "generator-error", error: assureInputResult.error },
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
            { status: "solution-error", error: assureOutputResult.error },
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
