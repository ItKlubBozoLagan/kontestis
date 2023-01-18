import {Submission} from "../types/Submission";
import {DataBase} from "../data/Database";
import {Testcase} from "../types/Testcase";
import {Snowflake} from "../lib/snowflake";
import {httpEvaluator} from "../api/axios";


type EvaluatorTestCase = {
    id: Snowflake,
    in: string,
    out: string
}

type EvaluatorData = {
    language: "python" | "cpp" | "c",
    code: string,
    time_limit: number,
    testcases: EvaluatorTestCase[]
}

export const runEvaluation = async (submission: Submission) => {

    const clusterIds = await DataBase.selectFrom("clusters", ["id"], { problem_id: submission.problem_id });

    const problem = await DataBase.selectOneFrom("problems", ["time_limit_millis"], { id: submission.problem_id });

    let testCases: Testcase[] = [];
    for(const id of clusterIds) {
        const clusterTestcases = await DataBase.selectFrom("testcases", "*", { cluster_id: id.id });
        testCases = [...testCases, ...clusterTestcases];
    }

    const evaluatorTestCases: EvaluatorTestCase[] = testCases.map((t) => {
        return {
            id: t.id,
            in: t.input,
            out: t.correctOutput ?? ""
        }
    });

    const evaluatorData: EvaluatorData = {
        language: submission.language,
        code: submission.code,
        testcases: evaluatorTestCases,
        time_limit: problem ? problem.time_limit_millis : 1000
    }

    httpEvaluator.post("/", { ...evaluatorData });
};