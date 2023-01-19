import { Type } from "@sinclair/typebox";
import { Router } from "express";
import { StatusCodes } from "http-status-codes";

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
import { respond } from "../utils/response";
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
    async (req: AuthenticatedRequest, res) => {
        const user = req.user!;

        const date = new Date(req.body.start_time);

        if (!date || date < new Date())
            return respond(res, StatusCodes.BAD_REQUEST);

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
    async (req: AuthenticatedRequest, res) => {
        const contests = (await Database.selectFrom("contests", "*")).filter(
            (c) =>
                isAllowedToViewContest(req.user ? req.user.id : undefined, c.id)
        );

        return respond(res, StatusCodes.OK, contests);
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
        req: AuthenticatedRequest & ValidatedBody<typeof allowUserSchema>,
        res
    ) => {
        const user = req.user!;

        const contest = await Database.selectOneFrom("contests", "*", {
            id: req.params.contest_id,
        });

        if (!contest) return respond(res, StatusCodes.NOT_FOUND);

        if (contest.public) return respond(res, StatusCodes.BAD_REQUEST);

        if (!(await isAllowedToModifyContest(user.id, contest.id)))
            return respond(res, StatusCodes.FORBIDDEN);

        const databaseUser = await Database.selectOneFrom("users", "*", {
            id: req.body.user_id,
        });

        if (!databaseUser) return respond(res, StatusCodes.NOT_FOUND);

        const allowedDatabaseUser = await Database.selectOneFrom(
            "allowed_users",
            "*",
            {
                user_id: databaseUser.id,
                contest_id: contest.id,
            }
        );

        if (allowedDatabaseUser) return respond(res, StatusCodes.CONFLICT);

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

ContestHandler.get(
    "/allow/:contest_id",
    useOptionalAuth,
    async (req: AuthenticatedRequest, res) => {
        const contest = await Database.selectOneFrom("contests", "*", {
            id: req.params.contest_id,
        });

        if (!contest) return respond(res, StatusCodes.NOT_FOUND);

        if (contest.public) return respond(res, StatusCodes.BAD_REQUEST);

        if (
            !(await isAllowedToViewContest(
                req.user ? req.user.id : undefined,
                contest.id
            ))
        )
            return respond(res, StatusCodes.NOT_FOUND);

        const allowedUsers = await Database.selectFrom(
            "allowed_users",
            ["user_id"],
            { contest_id: contest.id }
        );

        return respond(res, StatusCodes.OK, allowedUsers);
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
    async (req: AuthenticatedRequest, res) => {
        const contest = await Database.selectOneFrom("contests", "*", {
            id: req.params.contest_id,
        });

        if (!contest) return respond(res, StatusCodes.NOT_FOUND);

        if (
            !(await isAllowedToViewContest(
                req.user ? req.user.id : undefined,
                contest.id
            ))
        )
            return respond(res, StatusCodes.NOT_FOUND);

        return respond(res, StatusCodes.OK, contest);
    }
);

export default ContestHandler;
