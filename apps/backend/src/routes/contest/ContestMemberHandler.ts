import {
    AdminPermissions,
    ContestMemberPermissions,
    hasAdminPermission,
    hasContestPermission,
} from "@kontestis/models";
import { Type } from "@sinclair/typebox";
import { Router } from "express";
import { StatusCodes } from "http-status-codes";
import { grantPermission } from "permissio";

import { Database } from "../../database/Database";
import { SafeError } from "../../errors/SafeError";
import { extractContest } from "../../extractors/extractContest";
import { extractContestMember } from "../../extractors/extractContestMember";
import { extractUser } from "../../extractors/extractUser";
import { generateSnowflake } from "../../lib/snowflake";
import { useValidation } from "../../middlewares/useValidation";
import { respond } from "../../utils/response";

const ContestMemberHandler = Router({ mergeParams: true });

const RegisterSchema = Type.Object({
    email: Type.Optional(Type.String()),
});

ContestMemberHandler.post("/register", useValidation(RegisterSchema), async (req, res) => {
    const contest = await extractContest(req);
    const user = await extractUser(req);
    const targetUser = req.body.email
        ? await Database.selectOneFrom(
              "known_users",
              "*",
              { email: req.body.email },
              "ALLOW FILTERING"
          )
        : undefined;

    if (req.body.email && !targetUser) throw new SafeError(StatusCodes.NOT_FOUND);

    if (targetUser) {
        const contestMember = await extractContestMember(req, contest.id);

        if (
            !hasContestPermission(
                contestMember.contest_permissions,
                ContestMemberPermissions.ADD_USER
            ) &&
            !hasAdminPermission(user.permissions, AdminPermissions.EDIT_CONTEST)
        )
            throw new SafeError(StatusCodes.FORBIDDEN);
    }

    const addedMember = await Database.selectOneFrom("contest_members", ["id"], {
        user_id: targetUser ? targetUser.user_id : user.id,
        contest_id: contest.id,
    });

    if (Date.now() > contest.start_time.getTime() + contest.duration_seconds * 1000)
        throw new SafeError(StatusCodes.CONFLICT);

    if (addedMember) throw new SafeError(StatusCodes.CONFLICT);

    await Database.insertInto("contest_members", {
        id: generateSnowflake(),
        user_id: targetUser ? targetUser.user_id : user.id,
        contest_id: contest.id,
        contest_permissions: grantPermission(0n, ContestMemberPermissions.VIEW),
        // score will default to {}
    });

    return respond(res, StatusCodes.OK);
});

ContestMemberHandler.get("/", async (req, res) => {
    const contest = await extractContest(req);

    const contestMembers = await Database.selectFrom(
        "contest_members",
        "*",
        {
            contest_id: contest.id,
        },
        "ALLOW FILTERING"
    );

    return respond(
        res,
        StatusCodes.OK,
        contestMembers.map((it) => ({ ...it, score: it.score ?? {} }))
    );
});

ContestMemberHandler.get("/:user_id", async (req, res) => {
    const contest = await extractContest(req);
    const targetId = BigInt(req.params.user_id);

    const contestMember = await Database.selectOneFrom("contest_members", "*", {
        contest_id: contest.id,
        user_id: targetId,
    });

    return respond(
        res,
        StatusCodes.OK,
        contestMember ?? {
            user_id: targetId,
            contest_id: contest.id,
            contest_permissions: 0n,
            score: 0,
        }
    );
});

ContestMemberHandler.patch("/:user_id", async (req, res) => {
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
        { user_id: targetId, contest_id: contest.id, id: targetMember.id }
    );

    return respond(res, StatusCodes.OK);
});

ContestMemberHandler.delete("/:user_id", async (req, res) => {
    const contest = await extractContest(req);
    const targetId = BigInt(req.params.user_id);
    const contestMember = await extractContestMember(req);

    if (
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
        id: targetMember.id,
        user_id: targetId,
        contest_id: contest.id,
    });

    return respond(res, StatusCodes.OK);
});

export default ContestMemberHandler;
