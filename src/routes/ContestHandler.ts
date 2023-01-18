import { Type } from "@sinclair/typebox";
import { Router } from "express";

import { Database } from "../database/Database";
import { generateSnowflake } from "../lib/snowflake";
import {
    AuthenticatedRequest,
    useAuth,
    useOptionalAuth,
} from "../middlewares/useAuth";
import { useValidation, ValidatedBody } from "../middlewares/useValidation";
import { AllowedUser } from "../types/AllowedUser";
import { Contest } from "../types/Contest";
import {
    isAllowedToModifyContest,
    isAllowedToViewContest,
} from "../utils/utills";

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

ContestHandler.post(
    "/",
    useAuth,
    useValidation(contestSchema),
    async (request: AuthenticatedRequest, res) => {
        if (!request.user) return res.status(403);

        const { user } = request;
        const date = new Date(request.body.start_time);

        if (!date || date < new Date())
            return res.status(400).send("Invalid date!");

        const contest: Contest = {
            id: generateSnowflake(),
            name: request.body.name,
            admin_id: user.id,
            start_time: date,
            duration_seconds: request.body.duration_seconds,
            public: request.body.public,
        };

        await Database.insertInto("contests", contest);

        return res.status(200).json(contest);
    }
);

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

ContestHandler.get(
    "/",
    useOptionalAuth,
    async (request: AuthenticatedRequest, res) => {
        const contests = (await Database.selectFrom("contests", "*")).filter(
            (c) =>
                isAllowedToViewContest(
                    request.user ? request.user.id : undefined,
                    c.id
                )
        );

        return res.status(200).json(contests);
    }
);

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
    useAuth,
    useValidation(allowUserSchema),
    async (
        request: AuthenticatedRequest & ValidatedBody<typeof allowUserSchema>,
        res
    ) => {
        if (!request.user) return res.status(403);

        const contest = await Database.selectOneFrom("contests", "*", {
            id: request.params.contest_id,
        });

        if (!contest) return res.status(404);

        if (!(await isAllowedToModifyContest(request.user.id, contest.id)))
            return res.status(403);

        const user = await Database.selectOneFrom("users", "*", {
            id: request.body.user_id,
        });

        if (!user) return res.status(404);

        if (contest.public) return res.status(409);

        if (
            await Database.selectOneFrom("allowed_users", "*", {
                user_id: user.id,
                contest_id: contest.id,
            })
        )
            return res.status(409);

        const allowedUser: AllowedUser = {
            id: generateSnowflake(),
            user_id: user.id,
            contest_id: contest.id,
        };

        await Database.insertInto("allowed_users", allowedUser);

        return res.status(200).json(allowedUser);
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

ContestHandler.get(
    "/allow/:contest_id",
    useOptionalAuth,
    async (request: AuthenticatedRequest, res) => {
        const contest = await Database.selectOneFrom("contests", "*", {
            id: request.params.contest_id,
        });

        if (!contest) return res.status(404);

        if (
            !(await isAllowedToViewContest(
                request.user ? request.user.id : undefined,
                contest.id
            ))
        )
            return res.status(404);

        if (contest.public) return res.status(409);

        const allowedUsers = await Database.selectFrom(
            "allowed_users",
            ["user_id"],
            { contest_id: contest.id }
        );

        return res.status(200).json(allowedUsers);
    }
);

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

ContestHandler.get(
    "/:contest_id",
    useOptionalAuth,
    async (request: AuthenticatedRequest, res) => {
        const contest = await Database.selectOneFrom("contests", "*", {
            id: request.params.contest_id,
        });

        if (!contest) return res.status(404);

        if (
            !(await isAllowedToViewContest(
                request.user ? request.user.id : undefined,
                contest.id
            ))
        )
            return res.status(404);

        return res.status(200).json(contest);
    }
);

export default ContestHandler;
