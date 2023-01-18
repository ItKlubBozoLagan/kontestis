import {raw, Router} from "express";
import {Type} from "@sinclair/typebox";
import {AuthenticatedRequest, useAuth, useOptionalAuth} from "../middlewares/useAuth";
import {useValidation, ValidatedBody} from "../middlewares/useValidation";
import {Database} from "../database/Database";
import {generateSnowflake} from "../lib/snowflake";
import {Problem} from "../types/Problem";
import {isAllowedToModifyContest, isAllowedToViewContest, isAllowedToViewProblem} from "../utils/utills";
import {Cluster} from "../types/Cluster";
import {Testcase} from "../types/Testcase";


const ProblemHandler = Router();

/**
 * @apiDefine ExampleProblem
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *         "id": "135343706118033408",
 *         "contest_id": "135335143509331968",
 *         "description": "Example!",
 *         "title": "Example Problem",
 *         "evaluation_variant": "plain",
 *         "time_limit_millies": 1000,
 *         "memory_limit_megabytes": 512
 *     }
 */

/**
 * @apiDefine ExampleCluster
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *         "id": "135343706118033408",
 *         "problem_id": "135335143509331968",
 *         "awarded_score": 20
 *     }
 */

/**
 * @apiDefine ExampleTestcase
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *         "id": "135343706118033408",
 *         "cluster_id": "135335143509331968",
 *         "input": "10 2",
 *         "correctOutput": "20"
 *     }
 */

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

/**
 * @api {post} /api/problem CreateProblem
 * @apiName CreateProblem
 * @apiGroup Problem
 *
 * @apiUse RequiredAuth
 *
 * @apiBody {String} title Title of the problem.
 * @apiBody {String} description Description of the problem.
 * @apiBody {String="plain","script","interactive"} evaluation_variant Evaluation variant.
 * @apiBody {String} [evaluation_script] If the variant is not plain a script needs to be provided.
 * @apiBody {Number} time_limit_millis Time limit in milliseconds.
 * @apiBody {Number} memory_limit_megabytes The memory limit in megabytes.
 *
 * @apiSuccess {Object} problem Created problem.
 *
 * @apiUse ExampleProblem
 *
 * @apiError MissingScript If the evaluation script is needed but its missing.
 *
 * @apiErrorExample Error-Response:
 *     400 Bad request
 */

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

    await Database.insertInto("problems", problem);

    return res.status(200).json(problem);

});

/**
 * @api {delete} /api/problem/:problem_id DeleteProblem
 * @apiName DeleteProblem
 * @apiGroup Problem
 *
 * @apiUse RequiredAuth
 *
 * @apiParam {String} problem_id Id of the problem that will be deleted
 *
 * @apiSuccess {Object} problem Deleted problem.
 *
 * @apiUse ExampleProblem
 */

ProblemHandler.delete("/:problem_id", useAuth, async (req: AuthenticatedRequest, res) => {
    if(!req.user) return res.status(403).send("Access denied!");
    const problem = await Database.selectOneFrom("problems", "*", { id: req.params.problem_id });
    if(!problem) return res.status(404).send("Not found!");
    if(!(await isAllowedToModifyContest(req.user.id, problem.contest_id))) return res.status(403).send("Access denied!");

    await Database.deleteFrom("problems", "*", { id: problem.id });

    const clusters = await Database.selectFrom("clusters", "*", { problem_id: problem.id });
    await Database.deleteFrom("clusters", "*", { problem_id: problem.id });

    for (const c of clusters) {
        await Database.deleteFrom("testcases", "*", { cluster_id: c.id });
    }

    const submissions = await Database.selectFrom("submissions", "*", { problem_id: problem.id });
    await Database.deleteFrom("submissions", "*", { problem_id: problem.id });
    for(const s of submissions) {
        await Database.deleteFrom("cluster_submissions", "*", { submission_id: s.id });
        await Database.deleteFrom("testcase_submissions", "*", { submission_id: s.id });
    }


    return res.status(200).json(problem);
});

const clusterSchema = Type.Object({
    awarded_score: Type.Number({minimum: 1, maximum: 1000})
});

/**
 * @api {post} /api/problem/cluster/:problem_id CreateCluster
 * @apiName CreateCluster
 * @apiGroup Problem
 *
 * @apiUse RequiredAuth
 *
 * @apiParam {String} problem_id Id of the problem.
 *
 * @apiBody {Number} awarded_score The awared scrore for massing the cluster.
 *
 * @apiSuccess {Object} cluster Create cluster.
 *
 * @apiUse ExampleCluster
 *
 */

ProblemHandler.post("/cluster/:problem_id", useAuth, useValidation(clusterSchema), async (req: AuthenticatedRequest & ValidatedBody<typeof clusterSchema>, res) => {

    if(!req.user) return res.status(403).send("Access denied!");

    const problem = await Database.selectOneFrom("problems", "*", { id: req.params.problem_id });
    if(!problem) return res.status(404).send("Not found!");

    if(!(await isAllowedToModifyContest(req.user.id, problem.contest_id))) return res.status(403).send("Access denied!");

    const cluster: Cluster = {
        id: generateSnowflake(),
        problem_id: problem.id,
        awarded_score: req.body.awarded_score
    }

    await Database.insertInto("clusters", cluster);

    return res.status(200).json(cluster);
});


/**
 * @api {delete} /api/problem/cluster/:cluster_id DeleteCluster
 * @apiName DeleteCluster
 * @apiGroup Problem
 *
 * @apiUse RequiredAuth
 *
 * @apiParam {String} cluster_id Id of the cluster that will be deleted
 *
 * @apiSuccess {Object} cluster Deleted cluster.
 *
 * @apiUse ExampleCluster
 *
 */

ProblemHandler.delete("/cluster/:cluster_id", useAuth, async (req: AuthenticatedRequest, res) => {

    if(!req.user) return res.status(403).send("Access denied!");
    const cluster = await Database.selectOneFrom("clusters", "*", { id: req.params.cluster_id });
    if(!cluster) return res.status(404).send("Not found!");
    const problem = await Database.selectOneFrom("problems", "*", { id: cluster.problem_id });
    if(!problem) return res.status(500).send("Internal error!");
    if(!(await isAllowedToModifyContest(req.user.id, problem.contest_id))) return res.status(403).send("Access denied!");

    await Database.deleteFrom("clusters", "*", { id: cluster.id });
    const testcases = await Database.selectFrom("testcases", "*", { cluster_id: cluster.id });
    await Database.deleteFrom("testcases", "*", { cluster_id: cluster.id });
    await Database.deleteFrom("cluster_submissions", "*", { cluster_id: cluster.id });

    for(const testcase of testcases) {
        await Database.deleteFrom("testcase_submissions", "*", { testcase_id: testcase.id });
    }

    return res.status(200).json(cluster);
});

const testcaseSchema = Type.Object({
    input: Type.String(),
    correctOutput: Type.String({default: ""})
});

/**
 * @api {post} /api/problem/testcase/:cluster_id CreateTestcase
 * @apiName CreateTestcase
 * @apiGroup Problem
 *
 * @apiUse RequiredAuth
 *
 * @apiParam {String} cluster_id Id of the cluster.
 *
 * @apiBody {String} input Testcase input.
 * @apiBody {String} correctOutput Testcase correct output, empty string if not needed.
 *
 * @apiSuccess {Object} testcase Created testcase.
 *
 * @apiUse ExampleTestcase
 *
 */

ProblemHandler.post("/testcase/:cluster_id", useAuth, useValidation(testcaseSchema), async (req: AuthenticatedRequest & ValidatedBody<typeof testcaseSchema>, res) => {

    if(!req.user) return res.status(403).send("Access denied!");

    const cluster = await Database.selectOneFrom("clusters", "*", { id: req.params.cluster_id });
    if(!cluster) return res.status(404).send("Not found!");

    const problem = await Database.selectOneFrom("problems", "*", { id: cluster.problem_id });
    if(!problem) return res.status(500).send("Internal error!");

    if(!(await isAllowedToModifyContest(req.user.id, problem.contest_id))) return res.status(403).send("Access denied!");

    const testcase: Testcase = {
        id: generateSnowflake(),
        cluster_id: cluster.id,
        input: req.body.input,
        correctOutput: req.body.correctOutput
    };

    await Database.insertInto("testcases", testcase);

    return res.status(200).json(testcase);

});


/**
 * @api {delete} /api/problem/testcase/:testcase_id DeleteTestcase
 * @apiName DeleteTestcase
 * @apiGroup Problem
 *
 * @apiUse RequiredAuth
 *
 * @apiParam {String} testcase_id Id of the testcase.
 *
 *
 * @apiSuccess {Object} testcase Deleted testcase.
 *
 * @apiUse ExampleTestcase
 *
 */

ProblemHandler.delete("/testcase/:testcase_id", useAuth, async (req: AuthenticatedRequest, res) => {

    if(!req.user) return res.status(403).send("Access denied!");

    const testcase = await Database.selectOneFrom("testcases", "*", { id: req.params.testcase_id });
    if(!testcase) return res.status(404).send("Not found!");

    const cluster = await Database.selectOneFrom("clusters", "*", { id: testcase.cluster_id });
    if(!cluster) return res.status(500).send("Internal error!");

    const problem = await Database.selectOneFrom("problems", "*", { id: cluster.problem_id });
    if(!problem) return res.status(500).send("Internal error!");

    if(!(await isAllowedToModifyContest(req.user.id, problem.contest_id))) return res.status(403).send("Access denied!");

    await Database.deleteFrom("testcases", "*", { id: testcase.id });
    await Database.deleteFrom("testcase_submissions", "*", { testcase_id: testcase.id });

    return res.status(200).json(testcase);
})

const getSchema = Type.Object({
    contest_id: Type.String()
})


/**
 * @api {get} /api/problem GetProblems
 * @apiName GetProblems
 * @apiGroup Problem
 *
 * @apiUse RequiredAuth
 *
 * @apiQuery {String} contest_id If of the contest to view problems.
 *
 * @apiSuccess {Object} problems Contest problems.
 *
 * @apiUse ExampleProblem
 */

ProblemHandler.get("/", useOptionalAuth, useValidation(getSchema, { query: true }), async (req: AuthenticatedRequest & ValidatedBody<typeof getSchema>, res) => {

    const problems = await Database.selectFrom("problems", "*", { contest_id: req.query.contest_id });

    if(!(await isAllowedToViewContest(req.user ? req.user.id : undefined, req.query.contest_id))) return res.status(404).send("Not found");

    return res.status(200).json(problems);
});

/**
 * @api {get} /api/problem/:problem_id GetProblem
 * @apiName GetProblem
 * @apiGroup Problem
 *
 * @apiParam {String} problem_id Id of the problem.
 *
 * @apiUse RequiredAuth
 *
 * @apiSuccess {Object} problem Selected problem.
 *
 * @apiUse ExampleProblem
 *
 */

ProblemHandler.get("/:problem_id", useOptionalAuth, async (req: AuthenticatedRequest, res) => {

    const problem = await Database.selectOneFrom("problems", "*", { id: req.params.problem_id });
    if(!problem) return res.status(404).send("Not found!");

    if(!(await isAllowedToViewProblem(req.user ? req.user.id : undefined, problem.id))) return res.status(404).send("Not found!");

    if(!req.user || !(await isAllowedToModifyContest(req.user.id, problem.contest_id))) delete problem.evaluation_script;

    return res.status(200).json(problem);
});

/**
 * @api {get} /api/cluster/:problem_id GetClusters
 * @apiName GetClusters
 * @apiGroup Problem
 *
 * @apiParam {String} problem_id Id of the problem.
 *
 * @apiUse RequiredAuth
 *
 * @apiSuccess {Object} clusters Problem clusters.
 *
 * @apiUse ExampleCluster
 *
 */

ProblemHandler.get("/cluster/:problem_id", useOptionalAuth, async (req: AuthenticatedRequest, res) => {

    const problem = await Database.selectOneFrom("problems", "*", { id: req.params.problem_id });
    if(!problem) return res.status(404).send("Not found!");

    if(!(await isAllowedToViewProblem(req.user ? req.user.id : undefined, problem.id))) return res.status(404).send("Not found!");
    const clusters = await Database.selectFrom("clusters", "*", { problem_id: problem.id });
    return res.status(200).json(clusters);
});

/**
 * @api {get} /api/testcase/:cluster_id GetTestcases
 * @apiName GetTestcases
 * @apiGroup Problem
 *
 * @apiParam {String} cluster_id Id of the cluster.
 *
 * @apiUse RequiredAuth
 *
 * @apiSuccess {Object} testcases Cluster testcases.
 *
 * @apiUse ExampleTestcase
 *
 */

ProblemHandler.get("/testcase/:cluster_id", useOptionalAuth, async (req: AuthenticatedRequest, res) => {

    const cluster = await Database.selectOneFrom("clusters", "*", { id: req.params.cluster_id });
    if(!cluster) return res.status(404).send("Not found!");
    const problem = await Database.selectOneFrom("problems", "*", { id: cluster.problem_id });
    if(!problem) return res.status(500).send("Internal error!");
    if(!(await isAllowedToViewProblem(req.user ? req.user.id : undefined, problem.id))) return res.status(404).send("Not found!");
    const contest = await Database.selectOneFrom("contests", "*", { id: problem.contest_id });
    if(!contest) return res.status(500).send("Internal error!");

    const testcases = await Database.selectFrom("testcases", "*", { cluster_id: cluster.id });


    if(contest.start_time.getTime() + contest.duration_seconds * 1000 < Date.now()) return res.status(200).json(testcases);
    if(await isAllowedToModifyContest(req.user ? req.user.id : undefined, contest.id)) return res.status(200).json(testcases);

    return res.status(404).send("Not found!");
});

export default ProblemHandler;
