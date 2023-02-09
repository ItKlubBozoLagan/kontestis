import {
    AllowedUser,
    Contest,
    ContestMemberPermissions,
    hasContestPermission,
} from "@kontestis/models";
import { Type } from "@sinclair/typebox";
import { Router } from "express";
import { StatusCodes } from "http-status-codes";
import { grantPermission } from "permissio";

import {
    AdminPermissions,
    hasAdminPermission,
} from "../../../../packages/models/src/permissions/AdminPermissions";
import { Database } from "../database/Database";
import { SafeError } from "../errors/SafeError";
import { extractContest } from "../extractors/extractContest";
import { extractModifiableContest } from "../extractors/extractModifiableContest";
import { extractUser } from "../extractors/extractUser";
import { generateSnowflake } from "../lib/snowflake";
import { useValidation } from "../middlewares/useValidation";
import { respond } from "../utils/response";

const ContestHandler = Router();

const contestSchema = Type.Object({
    name: Type.String(),
    past_contest: Type.Boolean({ default: false }),
    start_time_millis: Type.Number(),
    duration_seconds: Type.Number({
        minimum: 10 * 60,
        maximum: 7 * 24 * 60 * 60,
    }),
    public: Type.Boolean(),
});

ContestHandler.post("/", useValidation(contestSchema), async (req, res) => {
    const user = await extractUser(req);

    if (!hasAdminPermission(user.permissions, AdminPermissions.ADD_CONTEST))
        throw new SafeError(StatusCodes.FORBIDDEN);

    const date = new Date(req.body.start_time_millis);

    if (!date || (!req.body.past_contest && req.body.start_time_millis < Date.now()))
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

ContestHandler.patch("/:contest_id", useValidation(contestSchema), async (req, res) => {
    const contest = await extractModifiableContest(req);

    const date = new Date(req.body.start_time_millis);

    if (!date) throw new SafeError(StatusCodes.BAD_REQUEST);

    await Database.update(
        "contests",
        {
            name: req.body.name,
            start_time: date,
            duration_seconds: req.body.duration_seconds,
            public: req.body.public,
        },
        { id: contest.id }
    );

    respond(res, StatusCodes.OK);
});

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

ContestHandler.post("/allow/:contest_id", useValidation(allowUserSchema), async (req, res) => {
    const contest = await extractModifiableContest(req);

    const databaseUser = await Database.selectOneFrom("users", "*", {
        id: BigInt(req.body.user_id),
    });

    if (!databaseUser) throw new SafeError(StatusCodes.NOT_FOUND);

    const allowedDatabaseUser = await Database.selectOneFrom("allowed_users", "*", {
        user_id: databaseUser.id,
        contest_id: contest.id,
    });

    if (allowedDatabaseUser) throw new SafeError(StatusCodes.CONFLICT);

    const allowedUser: AllowedUser = {
        id: generateSnowflake(),
        user_id: databaseUser.id,
        contest_id: contest.id,
    };

    await Database.insertInto("allowed_users", allowedUser);

    return respond(res, StatusCodes.OK, allowedUser);
});

ContestHandler.post("/register/:contest_id", async (req, res) => {
    const contest = await extractContest(req);
    const user = await extractUser(req);

    const targetId = req.body.user_id ? BigInt(req.body.user_id) : undefined;

    if (targetId) {
        const contestMember = await Database.selectOneFrom("contest_members", "*", {
            user_id: user.id,
            contest_id: contest.id,
        });

        if (!contestMember) throw new SafeError(StatusCodes.FORBIDDEN);

        if (
            !hasContestPermission(
                contestMember.contest_permissions,
                ContestMemberPermissions.ADD_USER
            )
        )
            throw new SafeError(StatusCodes.FORBIDDEN);
    }

    const addedMember = await Database.selectOneFrom("contest_members", ["id"], {
        user_id: targetId ?? user.id,
        contest_id: contest.id,
    });

    if (Date.now() > contest.start_time.getTime()) throw new SafeError(StatusCodes.CONFLICT);

    if (addedMember) throw new SafeError(StatusCodes.CONFLICT);

    await Database.insertInto("contest_members", {
        user_id: targetId ?? user.id,
        contest_id: contest.id,
        contest_permissions: grantPermission(0n, ContestMemberPermissions.VIEW),
    });

    return respond(res, StatusCodes.OK);
});

ContestHandler.get("/members/:contest_id", async (req, res) => {
    const contest = await extractContest(req);

    const contestMembers = await Database.selectFrom("contest_members", "*", {
        contest_id: contest.id,
    });

    return respond(res, StatusCodes.OK, contestMembers);
});

// eslint-disable-next-line sonarjs/no-duplicate-string
ContestHandler.get("/members/:contest_id/:user_id", async (req, res) => {
    const contest = await extractContest(req);
    const targetId = BigInt(req.params.user_id);

    const contestMember = await Database.selectOneFrom("contest_members", "*", {
        contest_id: contest.id,
        user_id: targetId,
    });

    if (!contestMember) throw new SafeError(StatusCodes.NOT_FOUND);

    return respond(res, StatusCodes.OK, contestMember);
});

ContestHandler.patch("/members/:contest_id/:user_id", async (req, res) => {
    const contest = await extractContest(req);
    const user = await extractUser(req);

    const targetId = BigInt(req.params.user_id);

    const contestMember = await Database.selectOneFrom("contest_members", "*", {
        user_id: user.id,
        contest_id: contest.id,
    });

    const newPermissions = req.body.contest_permissions
        ? BigInt(req.body.contest_permissions)
        : undefined;

    if (!newPermissions) throw new SafeError(StatusCodes.BAD_REQUEST);

    if (
        !contestMember ||
        !hasContestPermission(
            contestMember.contest_permissions,
            ContestMemberPermissions.EDIT_USER_PERMISSIONS
        )
    )
        throw new SafeError(StatusCodes.FORBIDDEN);

    const targetMember = await Database.selectOneFrom("contest_members", "*", {
        user_id: targetId,
        contest_id: contest.id,
    });

    if (!targetMember) throw new SafeError(StatusCodes.NOT_FOUND);

    await Database.update(
        "contest_members",
        { contest_permissions: newPermissions },
        { user_id: targetId, contest_id: contest.id }
    );

    return respond(res, StatusCodes.OK);
});

ContestHandler.delete("/members/:contest_id/:user_id", async (req, res) => {
    const contest = await extractContest(req);
    const user = await extractUser(req);
    const targetId = BigInt(req.params.user_id);
    const contestMember = await Database.selectOneFrom("contest_members", "*", {
        user_id: user.id,
        contest_id: contest.id,
    });

    if (
        !contestMember ||
        !hasContestPermission(
            contestMember.contest_permissions,
            ContestMemberPermissions.REMOVE_USER
        )
    )
        throw new SafeError(StatusCodes.FORBIDDEN);

    const targetMember = await Database.selectOneFrom("contest_members", ["id"], {
        user_id: targetId,
        contest_id: contest.id,
    });

    if (!targetMember) throw new SafeError(StatusCodes.NOT_FOUND);

    await Database.deleteFrom("contest_members", "*", {
        user_id: targetId,
        contest_id: contest.id,
    });

    return respond(res, StatusCodes.OK);
});

ContestHandler.get("/:contest_id", async (req, res) => {
    const contest = await extractContest(req);

    return respond(res, StatusCodes.OK, contest);
});

export default ContestHandler;
