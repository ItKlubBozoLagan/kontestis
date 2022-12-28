import {raw, Router} from "express";
import {Type} from "@sinclair/typebox";
import {AuthenticatedRequest, useAuth, useOptionalAuth} from "../middlewares/useAuth";
import {useValidation, ValidatedBody} from "../middlewares/useValidation";
import {DataBase} from "../data/Database";
import {generateSnowflake} from "../lib/snowflake";
import {Problem} from "../types/Problem";
import {isAllowedToModifyContest, isAllowedToViewContest, isAllowedToViewProblem} from "../utils/utills";
import {Cluster} from "../types/Cluster";
import {Testcase} from "../types/Testcase";


const ProblemHandler = Router();

enum EvaluationSchema {
    plain = "plain",
    script = "script",
    interactive = "interactive"
}

const problemSchema = Type.Object({
    contest_id: Type.Number(),
    title: Type.String(),
    description: Type.String(),
    evaluation_variant: Type.Enum(EvaluationSchema),
    time_limit_millis: Type.Number({ minimum: 50, maximum: 10000 }),
    memory_limit_megabytes: Type.Number({ minimum: 32, maximum: 1024 })
});

ProblemHandler.post("/", useAuth, useValidation(problemSchema), async (req: AuthenticatedRequest & ValidatedBody<typeof problemSchema>, res) => {

    if(!req.user) return res.status(403).send("Access denied!");

    if(!(await isAllowedToModifyContest(req.user.id, req.body.contest_id))) return res.status(403).send("Access denied!");

    if(req.body.evaluation_variant != "plain" && !req.body.evaluation_script) return res.status(400).send("Bad request!");

    const problem: Problem = {
        id: generateSnowflake(),
        contest_id: req.body.contest_id,
        title: req.body.title,
        description: req.body.description,
        evaluation_variant: req.body.evaluation_variant,
        evaluation_script: req.body.evaluation_script,
        time_limit_millis: req.body.time_limit_millis,
        memory_limit_megabytes: req.body.memory_limit_megabytes
    }

    await DataBase.insertInto("problems", problem);

    return res.status(200).json(problem);

});

const clusterSchema = Type.Object({
    awarded_score: Type.Number({minimum: 1, maximum: 1000})
});

ProblemHandler.post("/cluster/:problem_id", useAuth, useValidation(clusterSchema), async (req: AuthenticatedRequest & ValidatedBody<typeof clusterSchema>, res) => {

    if(!req.user) return res.status(403).send("Access denied!");

    const problem = await DataBase.selectOneFrom("problems", "*", { id: req.params.problem_id });
    if(!problem) return res.status(404).send("Not found!");

    if(!(await isAllowedToModifyContest(req.user.id, problem.contest_id))) return res.status(403).send("Access denied!");

    const cluster: Cluster = {
        id: generateSnowflake(),
        problem_id: problem.id,
        awarded_score: req.body.awarded_score
    }

    await DataBase.insertInto("clusters", cluster);

    return res.status(200).json(cluster);
});

const testcaseSchema = Type.Object({
    input: Type.String(),
    correctOutput: Type.String({default: ""})
});

ProblemHandler.post("/testcase/:cluster_id", useAuth, useValidation(testcaseSchema), async (req: AuthenticatedRequest & ValidatedBody<typeof testcaseSchema>, res) => {

    if(!req.user) return res.status(403).send("Access denied!");

    const cluster = await DataBase.selectOneFrom("clusters", "*", { id: req.params.cluster_id });
    if(!cluster) return res.status(404).send("Not found!");

    const problem = await DataBase.selectOneFrom("problems", "*", { id: cluster.problem_id });
    if(!problem) return res.status(500).send("Internal error!");

    if(!(await isAllowedToModifyContest(req.user.id, problem.contest_id))) return res.status(403).send("Access denied!");

    const testcase: Testcase = {
        id: generateSnowflake(),
        cluster_id: cluster.id,
        input: req.body.input,
        correctOutput: req.body.correctOutput
    };

    await DataBase.insertInto("testcases", testcase);

    return res.status(200).json(testcase);

});

const getSchema = Type.Object({
    contest_id: Type.String()
})

ProblemHandler.get("/", useOptionalAuth, useValidation(getSchema, { query: true }), async (req: AuthenticatedRequest & ValidatedBody<typeof getSchema>, res) => {

    const problems = await DataBase.selectFrom("problems", "*", { contest_id: req.query.contest_id });

    if(!(await isAllowedToViewContest(req.user ? req.user.id : undefined, req.query.contest_id))) return res.status(404).send("Not found");

    return res.status(200).json(problems);
});

ProblemHandler.get("/:problem_id", useOptionalAuth, async (req: AuthenticatedRequest, res) => {

    const problem = await DataBase.selectOneFrom("problems", "*", { id: req.params.problem_id });
    if(!problem) return res.status(404).send("Not found!");

    if(!(await isAllowedToViewProblem(req.user ? req.user.id : undefined, problem.id))) return res.status(404).send("Not found!");

    if(!req.user || !(await isAllowedToModifyContest(req.user.id, problem.contest_id))) delete problem.evaluation_script;

    return res.status(200).json(problem);
});

ProblemHandler.get("/cluster/:problem_id", useOptionalAuth, async (req: AuthenticatedRequest, res) => {

    const problem = await DataBase.selectOneFrom("problems", "*", { id: req.params.problem_id });
    if(!problem) return res.status(404).send("Not found!");

    if(!(await isAllowedToViewProblem(req.user ? req.user.id : undefined, problem.id))) return res.status(404).send("Not found!");
    const clusters = await DataBase.selectFrom("clusters", "*", { problem_id: problem.id });
    return res.status(200).json(clusters);
});

ProblemHandler.get("/testcase/:cluster_id", useOptionalAuth, async (req: AuthenticatedRequest, res) => {

    const cluster = await DataBase.selectOneFrom("clusters", "*", { id: req.params.cluster_id });
    if(!cluster) return res.status(404).send("Not found!");
    const problem = await DataBase.selectOneFrom("problems", "*", { id: cluster.problem_id });
    if(!problem) return res.status(500).send("Internal error!");
    if(!(await isAllowedToViewProblem(req.user ? req.user.id : undefined, problem.id))) return res.status(404).send("Not found!");
    const contest = await DataBase.selectOneFrom("contests", "*", { id: problem.contest_id });
    if(!contest) return res.status(500).send("Internal error!");

    const testcases = await DataBase.selectFrom("testcases", "*", { cluster_id: cluster.id });


    if(contest.start_time.getTime() + contest.duration_seconds * 1000 < Date.now()) return res.status(200).json(testcases);
    if(await isAllowedToModifyContest(req.user ? req.user.id : undefined, contest.id)) return res.status(200).json(testcases);

    return res.status(404).send("Not found!");
});