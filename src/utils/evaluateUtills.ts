import { httpEvaluatorInstance } from "../api/http";
import { Database } from "../database/Database";
import { Snowflake } from "../lib/snowflake";
import { Submission } from "../types/Submission";
import { Testcase } from "../types/Testcase";

type EvaluatorTestCase = {
    id: Snowflake;
    in: string;
    out: string;
};

type EvaluatorData = {
    language: "python" | "cpp" | "c";
    code: string;
    time_limit: number;
    testcases: EvaluatorTestCase[];
};

export const runEvaluation = async (submission: Submission) => {
    const clusterIds = await Database.selectFrom("clusters", ["id"], {
        problem_id: submission.problem_id,
    });

    const problem = await Database.selectOneFrom(
        "problems",
        ["time_limit_millis"],
        { id: submission.problem_id }
    );

    let testCases: Testcase[] = [];

    for (const id of clusterIds) {
        const clusterTestcases = await Database.selectFrom("testcases", "*", {
            cluster_id: id.id,
        });

        testCases = [...testCases, ...clusterTestcases];
    }

    const evaluatorTestCases: EvaluatorTestCase[] = testCases.map((t) => {
        return {
            id: t.id,
            in: t.input,
            out: t.correctOutput ?? "",
        };
    });

    const evaluatorData: EvaluatorData = {
        language: submission.language,
        code: submission.code,
        testcases: evaluatorTestCases,
        time_limit: problem ? problem.time_limit_millis : 1000,
    };

    httpEvaluatorInstance
        .post("/", { ...evaluatorData })
        .then((data) => console.log(data));
};
