import { Cluster, ClusterStatus, Snowflake, TestcaseWithOutput } from "@kontestis/models";
import { StatusCodes } from "http-status-codes";

import { Database } from "../database/Database";
import { SafeError } from "../errors/SafeError";
import { Redis } from "../redis/Redis";
import { RedisKeys } from "../redis/RedisKeys";
import { R } from "../utils/remeda";
import { splitAndEvaluateTestcases } from "./evaluation";

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

export const getClusterStatus = async (clusterId: Snowflake) => {
    return ((await Redis.get(RedisKeys.CLUSTER_STATUS(clusterId))) ?? "uncached") as ClusterStatus;
};

// TODO: number of tests
export const getAllTestcases: (c: Cluster) => Promise<TestcaseWithOutput[]> = async (
    cluster: Cluster
) => {
    const clusterStatus: ClusterStatus = await getClusterStatus(cluster.id);

    if (clusterStatus === "cached") {
        const testcaseIds = cluster.generator
            ? Array.from({ length: 10 }).map((_, index) => ({ id: BigInt(index) }))
            : await Database.selectFrom("testcases", ["id"], { cluster_id: cluster.id });

        return (await Promise.all(
            testcaseIds.map(async (it) => ({
                id: it.id,
                cluster_id: cluster.id,
                input: (await Redis.get(RedisKeys.CACHED_TESTCASE_INPUT(cluster.id, it.id))) ?? "",
                correct_output:
                    (await Redis.get(RedisKeys.CACHED_TESTCASE_OUTPUT(cluster.id, it.id))) ?? "",
            }))
        )) as TestcaseWithOutput[];
    }

    await generateTestcaseBatch(cluster, 10);

    if ((await getClusterStatus(cluster.id)) === "cached") return await getAllTestcases(cluster);

    return [];
};

const generateTestcaseInput = async (cluster: Cluster, count: number) => {
    const [data] = await splitAndEvaluateTestcases(
        {
            problemId: 0n,
            language: cluster.generator_language ?? "python",
            code: Buffer.from(cluster.generator_code ?? "", "utf8").toString("base64"),
            evaluator: RETURN_OUTPUT_EVALUATOR,
            evaluation_variant: "checker",
            evaluator_language: "python",
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
            evaluation_variant: "checker",
            evaluator_language: "python",
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

    const testcases: TestcaseWithOutput[] = [];

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
                EX: 15 * 60,
            });
            await Redis.set(
                RedisKeys.CACHED_TESTCASE_OUTPUT(cluster.id, tc.id),
                tc.correct_output ?? "",
                { EX: 15 * 60 }
            );
        })
    );

    await Redis.set(RedisKeys.CLUSTER_STATUS(cluster.id), "cached", { EX: 15 * 60 });

    return testcases;
};
