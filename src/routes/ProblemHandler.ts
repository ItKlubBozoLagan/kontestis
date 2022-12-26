import {Router} from "express";
import {Type} from "@sinclair/typebox";
import {AuthenticatedRequest, useAuth, useOptionalAuth} from "../middlewares/useAuth";
import {useValidation, ValidatedBody} from "../middlewares/useValidation";
import {DataBase} from "../data/Database";
import {generateSnowflake} from "../lib/snowflake";
import {Problem} from "../types/Problem";
import {isAllowedToModifyContest, isAllowedToViewContest, isAllowedToViewProblem} from "../utils/utills";


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

const getSchema = Type.Object({
    contest_id: Type.String()
})

ProblemHandler.get("/", useOptionalAuth, useValidation(getSchema, { query: true }), async (req: AuthenticatedRequest & ValidatedBody<typeof getSchema>, res) => {

    const problems = await DataBase.selectFrom("problems", "*", { contest_id: req.query.contest_id });

    if(!(await isAllowedToViewContest(req.user ? req.user.id : undefined, req.query.contest_id))) return res.status(404).send("Not found");

    return res.status(200).json(problems);
});

ProblemHandler.get("/:id", useOptionalAuth, async (req: AuthenticatedRequest, res) => {

    const problem = await DataBase.selectOneFrom("problems", "*", { id: req.params.id });
    if(!problem) return res.status(404).send("Not found!");

    if(!(await isAllowedToViewProblem(req.user ? req.user.id : undefined, problem.id))) return res.status(404).send("Not found!");

    if(!req.user || !(await isAllowedToModifyContest(req.user.id, problem.contest_id))) delete problem.evaluation_script;

    return res.status(200).json(problem);
});


