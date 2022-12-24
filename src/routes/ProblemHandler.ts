import {raw, Router} from "express";
import {Type} from "@sinclair/typebox";
import {AuthenticatedRequest, useAuth, useOptionalAuth} from "../middlewares/useAuth";
import {useValidation, ValidatedBody} from "../middlewares/useValidation";
import {DataBase} from "../data/Database";
import {generateSnowflake} from "../lib/snowflake";
import {bold} from "chalk";


const ProblemHandler = Router();

const problemSchema = Type.Object({
    contest_id: Type.Number(),
    title: Type.String(),
    description: Type.String(),
    time_limit_millis: Type.Number({ minimum: 50, maximum: 10000 }),
    memory_limit_megabytes: Type.Number({ minimum: 32, maximum: 1024 })
});

ProblemHandler.post("/", useAuth, useValidation(problemSchema), async (req: AuthenticatedRequest & ValidatedBody<typeof problemSchema>, res) => {

    if(!req.user) return res.status(403).send("Access denied!");

    const user = req.user;

    const contest = await DataBase.selectOneFrom("contests", "*", { id: req.body.contest_id });

    if(!contest) return res.status(404).send("Not found!")

    if(contest.admin_id != user.id && !(user.permissions & 1))
        return res.status(403).send("Access denied!")

    const problem = {
        id: generateSnowflake(),
        contest_id: req.body.contest_id,
        title: req.body.title,
        description: req.body.description,
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

    const id = req.query.contest_id;

    const contest = await DataBase.selectOneFrom("contests", "*", { id: req.query.contest_id });
});


