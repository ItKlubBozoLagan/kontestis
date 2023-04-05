import { Cluster, ClusterStatus, EvaluationResult, Snowflake, Testcase } from "@kontestis/models";
import axios, { AxiosError } from "axios";
import { StatusCodes } from "http-status-codes";

import { Database } from "../database/Database";
import { SafeError } from "../errors/SafeError";
import { Globals } from "../globals";
import { Redis } from "../redis/Redis";
import { RedisKeys } from "../redis/RedisKeys";
import { AxiosEvaluationResponse } from "./evaluation";

const RETURN_OUTPUT_EVALUATOR = `
def read_until(separator):
    out = ""
    while True:
        line = input()
        if line == separator:
            return out
        out += line + "\\n"

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

export const getClusterStatus = async (clusterId: Snowflake) => {
    return ((await Redis.get(RedisKeys.CLUSTER_STATUS(clusterId))) ?? "uncached") as ClusterStatus;
};

// TODO: Number of tests
export const getAllTestcases: (c: Cluster) => Promise<Testcase[]> = async (cluster: Cluster) => {
    const clusterStatus: ClusterStatus = await getClusterStatus(cluster.id);

    if (clusterStatus === "cached") {
        return (await Promise.all(
            Array.from({ length: 10 }).map(async (_, index) => ({
                id: BigInt(index),
                cluster_id: cluster.id,
                input: (await Redis.get(RedisKeys.CACHED_TESTCASE_INPUT(cluster.id, index))) ?? "",
                correct_output:
                    (await Redis.get(RedisKeys.CACHED_TESTCASE_OUTPUT(cluster.id, index))) ?? "",
            }))
        )) as Testcase[];
    }

    await generateTestcaseBatch(cluster, 10);

    if ((await getClusterStatus(cluster.id)) === "cached") return await getAllTestcases(cluster);

    return [];
};

// TODO: refactor
// eslint-disable-next-line sonarjs/cognitive-complexity
export const generateTestcaseBatch = async (cluster: Cluster, count: number) => {
    await Redis.set(RedisKeys.CLUSTER_STATUS(cluster.id), "pending");

    const [data, _error] = (await axios
        .post<EvaluationResult>(
            Globals.evaluatorEndpoint,
            {
                language: cluster.generator_language,
                code: Buffer.from(cluster.generator_code ?? "", "utf8").toString("base64"),
                time_limit: 60_000,
                memory_limit: 2048,
                testcases: Array.from({ length: count }).map((_, index) => ({
                    id: index.toString(),
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

    if (!data) {
        return await Redis.set(RedisKeys.CLUSTER_STATUS(cluster.id), "generator_error");
    }

    const problem = await Database.selectOneFrom("problems", "*", { id: cluster.problem_id });

    if (!problem) throw new SafeError(StatusCodes.INTERNAL_SERVER_ERROR);

    const inputData: Record<string, string> = {};

    for (const result of data) {
        if (result.type !== "success" || result.verdict !== "custom") {
            return await Redis.set(RedisKeys.CLUSTER_STATUS(cluster.id), "generator_error");
        }

        inputData[result.testCaseId] = result.verdict === "custom" ? result.extra : "";
    }

    const [rawOutData] = (await axios
        .post<EvaluationResult>(
            Globals.evaluatorEndpoint,
            {
                language: problem.solution_language,
                code: Buffer.from(problem.solution_code ?? "", "utf8").toString("base64"),
                time_limit: problem.time_limit_millis,
                memory_limit: problem.memory_limit_megabytes,
                testcases: Array.from({ length: count }).map((_, index) => ({
                    id: index.toString(),
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

    if (!rawOutData) {
        return await Redis.set(RedisKeys.CLUSTER_STATUS(cluster.id), "solution_error");
    }

    const testcases: Testcase[] = [];

    for (const result of rawOutData) {
        if (result.type !== "success" || result.verdict !== "custom") {
            return await Redis.set(RedisKeys.CLUSTER_STATUS(cluster.id), "solution_error");
        }

        testcases.push({
            id: BigInt(result.testCaseId),
            cluster_id: cluster.id,
            input: inputData[result.testCaseId],
            correct_output: result.extra,
        });
    }

    await Promise.all(
        testcases.map(async (tc) => {
            await Redis.set(RedisKeys.CACHED_TESTCASE_INPUT(cluster.id, Number(tc.id)), tc.input);
            await Redis.set(
                RedisKeys.CACHED_TESTCASE_OUTPUT(cluster.id, Number(tc.id)),
                tc.correct_output ?? ""
            );
        })
    );

    await Redis.set(RedisKeys.CLUSTER_STATUS(cluster.id), "cached");

    return testcases;
};
