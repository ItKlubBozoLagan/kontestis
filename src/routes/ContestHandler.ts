import {Router} from "express";
import {Type} from "@sinclair/typebox";
import {AuthenticatedRequest, useAuth, useOptionalAuth} from "../middlewares/useAuth";
import {useValidation} from "../middlewares/useValidation";
import {generateSnowflake} from "../lib/snowflake";
import {DataBase} from "../data/Database";


const ContestHandler = Router();

const contestSchema = Type.Object({
    name: Type.String(),
    start_time: Type.Number(),
    duration_seconds: Type.Number({ minimum: 10 * 60, maximum: 7 * 24 * 60 * 60 }),
    public: Type.Boolean()
});

ContestHandler.post("/", useAuth, useValidation(contestSchema), async (req: AuthenticatedRequest, res) => {

    if(!req.user) return res.status(403).send("Access denied!");

    const user = req.user;
    const date = new Date(req.body.start_time);
    if(!date || date < new Date()) return res.status(400).send("Invalid date!");

    const contest = {
        id: generateSnowflake(),
        admin_id: user.id,
        start_time: date,
        duration_seconds: req.body.duration_seconds,
        public: req.body.public,
    }

    await DataBase.insertInto("contests", contest);

    return res.status(200).json(contest);

});

ContestHandler.get("/:id", useOptionalAuth, async (req: AuthenticatedRequest , res) => {

    let contest = await DataBase.selectOneFrom("contests", "*", { id: req.params.id });
    if(!contest) return res.status(404).send("Not found!");

    if(contest.public) return res.status(200).json(contest);
    if(!req.user) return res.status(404).send("Not found!");

    const user = req.user;
    if((user.permissions & 1) || user.id == contest.admin_id) return res.status(200).json(contest);

    const allowedUser = await DataBase.selectOneFrom("allowed_users", "*", { user_id: user.id, contest_id: contest.id });
    if(!allowedUser) return res.status(404).send("Not found!");

    return res.status(200).json(contest);
});

export default ContestHandler;
