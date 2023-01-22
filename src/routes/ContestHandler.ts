import { Type } from "@sinclair/typebox";
import { Router } from "express";
import { StatusCodes } from "http-status-codes";

import { Database } from "../database/Database";
import { SafeError } from "../errors/SafeError";
import { extractContest } from "../extractors/extractContest";
import { extractModifiableContest } from "../extractors/extractModifiableContest";
import { extractUser } from "../extractors/extractUser";
import { generateSnowflake } from "../lib/snowflake";
import { useValidation } from "../middlewares/useValidation";
import { AllowedUser } from "../types/AllowedUser";
import { Contest } from "../types/Contest";
import { respond } from "../utils/response";

/**
 * @apiDefine ExampleContest
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *         "id": "135343706118033408",
 *         "admin_id": "135335143509331968",
 *         "duration_seconds": 3600,
 *         "name": "example-contest",
 *         "public": false,
 *         "start_time": "2023-01-09T14:09:43.889Z"
 *     }
 */

const ContestHandler = Router();

const contestSchema = Type.Object({
    name: Type.String(),
    start_time: Type.Number(),
    duration_seconds: Type.Number({
        minimum: 10 * 60,
        maximum: 7 * 24 * 60 * 60,
    }),
    public: Type.Boolean(),
});

/**
 * @api {post} /api/contest CreateContest
 * @apiName CreateContest
 * @apiGroup Contest
 *
 * @apiUse RequiredAuth
 *
 * @apiBody {String} name Name of the contest.
 * @apiBody {Number} start_time UTC Time stamp.
 * @apiBody {Number} duration_seconds Contest duration in seconds.
 * @apiBody {Boolean} public Controls is the contest open to everyone.
 *
 * @apiSuccess {Object} contest Created contest.
 *
 * @apiUse ExampleContest
 *
 * @apiError InvalidData The start date is not valid or has already past.
 *
 * @apiErrorExample Error-Response:
 *     400 Bad request
 */

ContestHandler.post("/", useValidation(contestSchema), async (req, res) => {
    const user = await extractUser(req);

    const date = new Date(req.body.start_time);

    if (!date || date < new Date())
        throw new SafeError(StatusCodes.BAD_REQUEST);

    const contest: Contest = {
        id: generateSnowflake(),
        name: req.body.name,
        admin_id: user.id,
        start_time: date,
        duration_seconds: req.body.duration_seconds,
        public: req.body.public,
    };

    await Database.insertInto("contests", contest);

    return respond(res, StatusCodes.OK, contest);
});

/**
 * @api {get} /api/contest GetContests
 * @apiName GetContests
 * @apiGroup Contest
 *
 * @apiUse RequiredAuth
 *
 * @apiSuccess {Object} contests List of all available contests, includes private contests only if authorisation is provided.
 *
 * @apiUse ExampleContest
 *
 */

ContestHandler.get("/", async (req, res) => {
    const contestIds = await Database.selectFrom("contests", ["id"]);
    const contests = [];

    for (const id of contestIds) {
        try {
            contests.push(await extractContest(req, id.id));
        } catch {
            // TODO: Clean this up a bit
        }
    }

    return respond(res, StatusCodes.OK, contests);
});

const allowUserSchema = Type.Object({
    user_id: Type.Number(),
});

/**
 * @api {post} /api/contest/allow/:contest_id AllowUser
 * @apiName AllowUser
 * @apiGroup Contest
 *
 * @apiUse RequiredAuth
 * @apiParam {String} contest_id Id of the contest.
 *
 * @apiBody {String} user_id Id of the user that should be allowed, requires modify permissions.
 *
 * @apiSuccess {Object} entry The created allow entry!.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *      "id": "135493206069481472",
 *      "user_id": "135335143509331968",
 *      "contest_id": "135493060095119360"
 *     }
 */

ContestHandler.post(
    "/allow/:contest_id",
    useValidation(allowUserSchema),
    async (req, res) => {
        const contest = await extractModifiableContest(req);

        const databaseUser = await Database.selectOneFrom("users", "*", {
            id: BigInt(req.body.user_id),
        });

        if (!databaseUser) throw new SafeError(StatusCodes.NOT_FOUND);

        const allowedDatabaseUser = await Database.selectOneFrom(
            "allowed_users",
            "*",
            {
                user_id: databaseUser.id,
                contest_id: contest.id,
            }
        );

        if (allowedDatabaseUser) throw new SafeError(StatusCodes.CONFLICT);

        const allowedUser: AllowedUser = {
            id: generateSnowflake(),
            user_id: databaseUser.id,
            contest_id: contest.id,
        };

        await Database.insertInto("allowed_users", allowedUser);

        return respond(res, StatusCodes.OK, allowedUser);
    }
);

/**
 * @api {get} /api/contest/allow/:contest_id GetAllowUser
 * @apiName GetAllowUser
 * @apiGroup Contest
 *
 * @apiUse RequiredAuth
 * @apiParam {String} contest_id Id of the contest.
 *
 *
 * @apiSuccess {Object} entrys All allowed user entries for the contest, requires modify permission.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *      "id": "135493206069481472",
 *      "user_id": "135335143509331968",
 *      "contest_id": "135493060095119360"
 *     }
 */

ContestHandler.get("/allow/:contest_id", async (req, res) => {
    const contest = await extractContest(req);

    if (contest.public) throw new SafeError(StatusCodes.BAD_REQUEST);

    const allowedUsers = await Database.selectFrom(
        "allowed_users",
        ["user_id"],
        { contest_id: contest.id }
    );

    return respond(res, StatusCodes.OK, allowedUsers);
});

/**
 * @api {get} /api/contest/:contest_id GetContest
 * @apiName GetContest
 * @apiGroup Contest
 *
 * @apiParam {String} contest_id Id of the contest.
 *
 * @apiUse RequiredAuth
 *
 * @apiSuccess {Object} contests Return the contest information, must have view permissions.
 *
 * @apiUse ExampleContest
 *
 */

ContestHandler.get("/:contest_id", async (req, res) => {
    const contest = await extractContest(req);

    return respond(res, StatusCodes.OK, contest);
});

export default ContestHandler;
