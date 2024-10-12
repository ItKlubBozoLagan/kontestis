import { ContestMemberPermissions } from "@kontestis/models";
import { Type } from "@sinclair/typebox";
import { Router } from "express";
import { StatusCodes } from "http-status-codes";
import { grantPermission } from "permissio";

import { Database } from "../../database/Database";
import { SafeError } from "../../errors/SafeError";
import { extractContest } from "../../extractors/extractContest";
import { extractUser } from "../../extractors/extractUser";
import { pushContestNotifications } from "../../lib/contest";
import { generateSnowflake } from "../../lib/snowflake";
import { useValidation } from "../../middlewares/useValidation";
import { mustHaveContestPermission } from "../../preconditions/hasPermission";
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
        await mustHaveContestPermission(req, ContestMemberPermissions.ADD_USER, contest.id);
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
    });

    const _ = pushContestNotifications(contest, [targetUser ? targetUser.user_id : user.id]);

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

    const targetId = BigInt(req.params.user_id);

    const newPermissions = req.body.contest_permissions
        ? BigInt(req.body.contest_permissions)
        : undefined;

    if (typeof newPermissions === "undefined") throw new SafeError(StatusCodes.BAD_REQUEST);

    await mustHaveContestPermission(
        req,
        ContestMemberPermissions.EDIT_USER_PERMISSIONS,
        contest.id
    );

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

    await mustHaveContestPermission(req, ContestMemberPermissions.REMOVE_USER, contest.id);

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
