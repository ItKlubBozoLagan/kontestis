import {
    AdminPermissions,
    AllowedUser,
    Contest,
    ContestAnnouncement,
    ContestMemberPermissions,
    ContestQuestion,
    hasAdminPermission,
    hasContestPermission,
} from "@kontestis/models";
import { Type } from "@sinclair/typebox";
import { Router } from "express";
import { StatusCodes } from "http-status-codes";
import { EMPTY_PERMISSIONS, grantPermission } from "permissio";
import * as R from "remeda";
import { eqIn } from "scyllo";

import { Database } from "../database/Database";
import { SafeError } from "../errors/SafeError";
import { extractContest } from "../extractors/extractContest";
import { extractContestMember } from "../extractors/extractContestMember";
import { extractModifiableContest } from "../extractors/extractModifiableContest";
import { extractUser } from "../extractors/extractUser";
import { generateSnowflake } from "../lib/snowflake";
import { useValidation } from "../middlewares/useValidation";
import { extractIdFromParameters } from "../utils/extractorUtils";
import { respond } from "../utils/response";

const ContestHandler = Router();

const contestSchema = Type.Object({
    name: Type.String(),
    past_contest: Type.Optional(Type.Boolean({ default: false })),
    start_time_millis: Type.Number(),
    duration_seconds: Type.Number({
        minimum: 10 * 60,
        maximum: 7 * 24 * 60 * 60,
    }),
    public: Type.Boolean(),
    official: Type.Boolean(),
});

ContestHandler.post("/", useValidation(contestSchema), async (req, res) => {
    const user = await extractUser(req);

    if (!hasAdminPermission(user.permissions, AdminPermissions.ADD_CONTEST))
        throw new SafeError(StatusCodes.FORBIDDEN);

    const date = new Date(req.body.start_time_millis);

    if (!date || (!req.body.past_contest && req.body.start_time_millis < Date.now()))
        throw new SafeError(StatusCodes.BAD_REQUEST);

    if (!hasAdminPermission(user.permissions, AdminPermissions.ADMIN) && req.body.official)
        throw new SafeError(StatusCodes.FORBIDDEN);

    const contest: Contest = {
        id: generateSnowflake(),
        name: req.body.name,
        admin_id: user.id, // legacy
        start_time: date,
        duration_seconds: req.body.duration_seconds,
        official: req.body.official,
        public: req.body.public,
        elo_applied: false,
    };

    await Promise.all([
        Database.insertInto("contests", contest),
        Database.insertInto("contest_members", {
            id: generateSnowflake(),
            user_id: user.id,
            contest_id: contest.id,
            contest_permissions: grantPermission(EMPTY_PERMISSIONS, ContestMemberPermissions.ADMIN),
        }),
    ]);

    return respond(res, StatusCodes.OK, contest);
});

ContestHandler.patch("/:contest_id", useValidation(contestSchema), async (req, res) => {
    const contest = await extractModifiableContest(req);
    const user = await extractUser(req);

    const date = new Date(req.body.start_time_millis);

    if (!date) throw new SafeError(StatusCodes.BAD_REQUEST);

    if (
        !hasAdminPermission(user.permissions, AdminPermissions.ADMIN) &&
        contest.official !== req.body.official
    )
        throw new SafeError(StatusCodes.FORBIDDEN);

    await Database.update(
        "contests",
        {
            name: req.body.name,
            start_time: date,
            duration_seconds: req.body.duration_seconds,
            public: req.body.public,
            official: req.body.official,
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

    const allowedDatabaseUser = await Database.selectOneFrom(
        "allowed_users",
        "*",
        {
            user_id: databaseUser.id,
            contest_id: contest.id,
        },
        // eslint-disable-next-line sonarjs/no-duplicate-string
        "ALLOW FILTERING"
    );

    if (allowedDatabaseUser) throw new SafeError(StatusCodes.CONFLICT);

    const allowedUser: AllowedUser = {
        id: generateSnowflake(),
        user_id: databaseUser.id,
        contest_id: contest.id,
    };

    await Database.insertInto("allowed_users", allowedUser);

    return respond(res, StatusCodes.OK, allowedUser);
});

const RegisterSchema = Type.Object({
    user_id: Type.Optional(Type.Number()),
});

ContestHandler.post("/register/:contest_id", useValidation(RegisterSchema), async (req, res) => {
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

    if (Date.now() > contest.start_time.getTime() + contest.duration_seconds * 1000)
        throw new SafeError(StatusCodes.CONFLICT);

    if (addedMember) throw new SafeError(StatusCodes.CONFLICT);

    await Database.insertInto("contest_members", {
        id: generateSnowflake(),
        user_id: targetId ?? user.id,
        contest_id: contest.id,
        contest_permissions: grantPermission(0n, ContestMemberPermissions.VIEW),
        // score will default to {}
    });

    return respond(res, StatusCodes.OK);
});

ContestHandler.get("/members/self", async (req, res) => {
    const user = await extractUser(req);
    const contestMembers = await Database.selectFrom(
        "contest_members",
        "*",
        { user_id: user.id },
        "ALLOW FILTERING"
    );

    return respond(res, StatusCodes.OK, contestMembers);
});

ContestHandler.get("/members/:contest_id", async (req, res) => {
    const contest = await extractContest(req);

    const contestMembers = await Database.selectFrom(
        "contest_members",
        "*",
        {
            contest_id: contest.id,
        },
        "ALLOW FILTERING"
    );

    return respond(res, StatusCodes.OK, contestMembers);
});

ContestHandler.get("/leaderboard/:contest_id", async (req, res) => {
    const contest = await extractContest(req);

    const contestMembers = await Database.selectFrom("contest_members", "*", {
        contest_id: contest.id,
    });

    const users = await Database.selectFrom("known_users", ["user_id", "full_name"], {
        user_id: eqIn(...contestMembers.map((it) => it.user_id)),
    });

    return respond(
        res,
        StatusCodes.OK,
        contestMembers
            .map((it) =>
                R.addProp(
                    it,
                    "full_name",
                    users.find((user) => user.user_id === it.user_id)?.full_name ?? "Joe Biden"
                )
            )
            .map((it) => ({ ...it, score: it.score ?? {} }))
    );
});

const announcementSchema = Type.Object({
    message: Type.String(),
});

ContestHandler.post(
    "/announcement/:contest_id",
    useValidation(announcementSchema),
    async (req, res) => {
        const member = await extractContestMember(req);

        if (
            !hasContestPermission(
                member.contest_permissions,
                ContestMemberPermissions.CREATE_ANNOUNCEMENT
            )
        )
            throw new SafeError(StatusCodes.FORBIDDEN);

        const contestAnnouncement: ContestAnnouncement = {
            id: generateSnowflake(),
            contest_id: member.contest_id,
            message: req.body.message,
        };

        await Database.insertInto("contest_announcements", contestAnnouncement);

        return respond(res, StatusCodes.OK, contestAnnouncement);
    }
);

ContestHandler.get("/announcement/:contest_id", async (req, res) => {
    const contest = await extractContest(req);

    const announcements = await Database.selectFrom("contest_announcements", "*", {
        contest_id: contest.id,
    });

    return respond(res, StatusCodes.OK, announcements);
});

const questionSchema = Type.Object({
    question: Type.String(),
});

ContestHandler.post("/question/:contest_id", useValidation(questionSchema), async (req, res) => {
    const member = await extractContestMember(req);

    const question: ContestQuestion = {
        id: generateSnowflake(),
        contest_id: member.contest_id,
        question: req.body.question,
        contest_member_id: member.id,
    };

    await Database.insertInto("contest_questions", question);

    return respond(res, StatusCodes.OK, question);
});

ContestHandler.get("/question/:contest_id", async (req, res) => {
    const member = await extractContestMember(req);

    const questions = await Database.selectFrom("contest_questions", "*", {
        contest_id: member.contest_id,
    });

    if (hasContestPermission(member.contest_permissions, ContestMemberPermissions.VIEW_QUESTIONS))
        return respond(res, StatusCodes.OK, questions);

    return respond(
        res,
        StatusCodes.OK,
        questions.filter((question) => question.contest_member_id === member.id)
    );
});

const questionAnswerSchema = Type.Object({
    response: Type.String(),
});

ContestHandler.patch(
    "/question/:question_id",
    useValidation(questionAnswerSchema),
    async (req, res) => {
        const questionId = extractIdFromParameters(req, "question_id");
        const question = await Database.selectOneFrom("contest_questions", "*", { id: questionId });

        if (!question) throw new SafeError(StatusCodes.NOT_FOUND);

        const member = await extractContestMember(req, question.contest_id);

        if (
            !hasContestPermission(
                member.contest_permissions,
                ContestMemberPermissions.ANSWER_QUESTIONS
            )
        )
            throw new SafeError(StatusCodes.FORBIDDEN);

        await Database.update(
            "contest_questions",
            {
                response: req.body.response,
                response_author_id: member.id,
            },
            { id: question.id }
        );

        return respond(res, StatusCodes.OK);
    }
);

// eslint-disable-next-line sonarjs/no-duplicate-string
ContestHandler.get("/members/:contest_id/:user_id", async (req, res) => {
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
