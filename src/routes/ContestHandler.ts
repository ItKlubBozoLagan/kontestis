import {Router} from "express";
import {Type} from "@sinclair/typebox";
import {AuthenticatedRequest, useAuth, useOptionalAuth} from "../middlewares/useAuth";
import {useValidation, ValidatedBody} from "../middlewares/useValidation";
import {generateSnowflake} from "../lib/snowflake";
import {DataBase} from "../data/Database";
import {isAllowedToModifyContest, isAllowedToViewContest} from "../utils/utills";
import {AllowedUser} from "../types/AllowedUser";


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

const allowUserSchema = Type.Object({
   user_id: Type.Number()
});

ContestHandler.post("/allow/:contest_id", useAuth, useValidation(allowUserSchema), async (req: AuthenticatedRequest & ValidatedBody<typeof allowUserSchema>, res) => {

    if (!req.user) return res.status(403).send("Access denied!");

    const contest = await DataBase.selectOneFrom("contests", "*", {id: req.params.contest_id});
    if (!contest) return res.status(404).send("Not found!");

    if (!(await isAllowedToModifyContest(req.user.id, contest.id))) return res.status(403).send("Access denied!");

    const user = await DataBase.selectOneFrom("users", "*", {id: req.body.user_id});
    if (!user) return res.status(404).send("Not found!");

    if(contest.public) return res.status(409).send("Conflict!");

    if(await DataBase.selectOneFrom("allowed_users", "*", { user_id: user.id, contest_id: contest.id }))
        return res.status(409).send("Conflict!");

    const allowedUser: AllowedUser = {
        id: generateSnowflake(),
        user_id: user.id,
        contest_id: contest.id
    };

    await DataBase.insertInto("allowed_users", allowedUser);

    return res.status(200).json(allowedUser);
});

ContestHandler.get("/allow/:contest_id", useOptionalAuth, async (req: AuthenticatedRequest, res) => {
    let contest = await DataBase.selectOneFrom("contests", "*", { id: req.params.contest_id });
    if(!contest) return res.status(404).send("Not found!");
    if(!(await isAllowedToViewContest(req.user ? req.user.id : undefined, contest.id))) return res.status(404).send("Not found!");
    if(contest.public) return res.status(409).send("Conflict!");

    const allowedUsers = await DataBase.selectFrom("allowed_users", ["user_id"], { contest_id: contest.id });
    return res.status(200).json(allowedUsers);
});

ContestHandler.get("/:contest_id", useOptionalAuth, async (req: AuthenticatedRequest , res) => {

    let contest = await DataBase.selectOneFrom("contests", "*", { id: req.params.contest_id });
    if(!contest) return res.status(404).send("Not found!");
    if(!(await isAllowedToViewContest(req.user ? req.user.id : undefined, contest.id))) return res.status(404).send("Not found!");
    return res.status(200).json(contest);
});

export default ContestHandler;
