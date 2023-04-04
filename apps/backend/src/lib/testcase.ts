import { Cluster, EvaluationResult, Snowflake, Testcase } from "@kontestis/models";
import axios, { AxiosError } from "axios";
import { StatusCodes } from "http-status-codes";
import * as R from "remeda";
import { isTruthy } from "remeda";

import { Database } from "../database/Database";
import { SafeError } from "../errors/SafeError";
import { Globals } from "../globals";
import { Redis } from "../redis/Redis";
import { RedisKeys } from "../redis/RedisKeys";
import { AxiosEvaluationResponse } from "./evaluation";
import { generateSnowflake } from "./snowflake";

const existsTestcase = async (clusterId: Snowflake, testcase: number) => {
    return (
        (await Redis.exists(RedisKeys.CACHED_TESTCASE_INPUT(clusterId, testcase))) &&
        (await Redis.exists(RedisKeys.CACHED_TESTCASE_OUTPUT(clusterId, testcase)))
    );
};

const RETURN_OUTPUT_EVALUATOR = `
def read_until(separator):
    out = ""
    while True:
        line = input()
        if line == separator:
            return out
        out += " " + line.strip()

while True:
    separator = input()
    if len(separator.strip()) > 0:
        break

read_until(separator)
out = read_until(separator)
subOut = read_until(separator)

print("custom:" + subOut.strip())

`;

const returnOutputEvaluatorBase64 = Buffer.from(RETURN_OUTPUT_EVALUATOR, "utf8").toString("base64");

// TODO: Number of tests
export const getAllTestcases = async (cluster: Cluster) => {
    return R.filter(
        await Promise.all(
            Array.from({ length: 10 }).map(
                async (_, index) => await getGeneratedTestcase(cluster, index + 1)
            )
        ),
        isTruthy
    );
};

const getGeneratedTestcase = async (cluster: Cluster, testcaseIndex: number) => {
    if (!cluster.generator) throw new SafeError(StatusCodes.INTERNAL_SERVER_ERROR);

    if (await existsTestcase(cluster.id, testcaseIndex)) {
        const testcase: Testcase = {
            id: generateSnowflake(),
            cluster_id: cluster.id,
            input:
                (await Redis.get(RedisKeys.CACHED_TESTCASE_INPUT(cluster.id, testcaseIndex))) ?? "",
            correct_output:
                (await Redis.get(RedisKeys.CACHED_TESTCASE_OUTPUT(cluster.id, testcaseIndex))) ??
                "",
        };

        return testcase;
    }

    // TODO: Move testcase count to the associated cluster
    const testcases: Testcase[] = await generateTestcaseBatch(cluster, 10);

    for (const testcase of testcases) {
        await Redis.set(
            RedisKeys.CACHED_TESTCASE_INPUT(cluster.id, Number(testcase.id)),
            testcase.input
        );
        await Redis.set(
            RedisKeys.CACHED_TESTCASE_OUTPUT(cluster.id, Number(testcase.id)),
            testcase.correct_output ?? ""
        );
    }

    return testcases.find((ts) => Number(ts.id) === testcaseIndex);
};

const generateTestcaseBatch = async (cluster: Cluster, count: number) => {
    const [data] = (await axios
        .post<EvaluationResult>(
            Globals.evaluatorEndpoint,
            {
                language: cluster.generator_language,
                code: cluster.generator_code,
                time_limit: 60_000,
                memory_limit: 2048,
                testcases: Array.from({ length: count }).map((_, index) => ({
                    id: index,
                    in: index.toString(),
                    out: "",
                })),
                evaluator: returnOutputEvaluatorBase64,
            },
            {
                timeout: 60_000,
            }
        )
        .then((data) => [data.data, undefined])
        .catch((error) => [undefined, error as AxiosError])) as AxiosEvaluationResponse;

    if (!data) throw new SafeError(StatusCodes.INTERNAL_SERVER_ERROR);

    const problem = await Database.selectOneFrom("problems", "*", { id: cluster.problem_id });

    if (!problem) throw new SafeError(StatusCodes.INTERNAL_SERVER_ERROR);

    const inputData: Record<string, string> = {};

    for (const result of data) {
        inputData[result.testCaseId] = result.verdict === "custom" ? result.extra : "";
    }

    const [rawOutData] = (await axios
        .post<EvaluationResult>(
            Globals.evaluatorEndpoint,
            {
                language: problem.solution_language,
                code: problem.solution_code,
                time_limit: problem.time_limit_millis,
                memory_limit: problem.memory_limit_megabytes,
                testcases: Array.from({ length: count }).map((_, index) => ({
                    id: index,
                    in: inputData[index.toString()],
                    out: "",
                })),
                evaluator: returnOutputEvaluatorBase64,
            },
            {
                timeout: 60_000,
            }
        )
        .then((data) => [data.data, undefined])
        .catch((error) => [undefined, error as AxiosError])) as AxiosEvaluationResponse;

    // TODO: Error handling stuffs...

    if (!rawOutData) throw new SafeError(StatusCodes.INTERNAL_SERVER_ERROR);

    const testcases: Testcase[] = [];

    for (const result of rawOutData) {
        if (result.type !== "success" || result.verdict !== "custom") continue;

        testcases.push({
            id: BigInt(result.testCaseId),
            cluster_id: cluster.id,
            input: inputData[result.testCaseId],
            correct_output: result.extra,
        });
    }

    return testcases;
};
