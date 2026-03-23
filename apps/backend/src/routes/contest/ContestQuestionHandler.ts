import {
    AdminPermissions,
    ContestChatMessage,
    ContestMemberPermissions,
    ContestQuestion,
    hasAdminPermission,
    hasContestPermission,
} from "@kontestis/models";
import { Type } from "@sinclair/typebox";
import { Router } from "express";
import { StatusCodes } from "http-status-codes";
import { eqIn } from "scyllo";

import { Database } from "../../database/Database";
import { SafeError } from "../../errors/SafeError";
import { extractContest } from "../../extractors/extractContest";
import { extractContestMember } from "../../extractors/extractContestMember";
import { extractUser } from "../../extractors/extractUser";
import { pushNotificationsToMany } from "../../lib/notifications";
import { generateSnowflake } from "../../lib/snowflake";
import { useValidation } from "../../middlewares/useValidation";
import { extractIdFromParameters } from "../../utils/extractorUtils";
import { respond } from "../../utils/response";

const ContestQuestionHandler = Router({ mergeParams: true });

const QuestionSchema = Type.Object({
    question: Type.String(),
});

// Create a new thread (with initial message)
ContestQuestionHandler.post("/", useValidation(QuestionSchema), async (req, res) => {
    const member = await extractContestMember(req);
    const contest = await extractContest(req);

    const now = new Date();

    const question: ContestQuestion = {
        id: generateSnowflake(),
        contest_id: member.contest_id,
        question: req.body.question,
        contest_member_id: member.id,
        last_message_at: now,
        last_message_member_id: member.id,
    };

    const firstMessage: ContestChatMessage = {
        id: generateSnowflake(),
        thread_id: question.id,
        contest_id: member.contest_id,
        author_member_id: member.id,
        content: req.body.question,
        created_at: now,
    };

    await Promise.all([
        Database.insertInto("contest_questions", question),
        Database.insertInto("contest_chat_messages", firstMessage),
    ]);

    const members = await Database.selectFrom(
        "contest_members",
        ["user_id", "contest_permissions"],
        {
            contest_id: member.contest_id,
        }
    );

    const privileged = members.filter((m) =>
        hasContestPermission(m.contest_permissions, ContestMemberPermissions.VIEW_QUESTIONS)
    );

    const _ = pushNotificationsToMany(
        {
            type: "new-question",
            data: contest.name,
        },
        privileged.map((it) => it.user_id)
    );

    return respond(res, StatusCodes.OK, question);
});

// List all threads
ContestQuestionHandler.get("/", async (req, res) => {
    const user = await extractUser(req);
    const contest = await extractContest(req);

    const questions = await Database.selectFrom("contest_questions", "*", {
        contest_id: contest.id,
    });

    if (hasAdminPermission(user.permissions, AdminPermissions.VIEW_CONTEST))
        return respond(res, StatusCodes.OK, questions);

    const member = await extractContestMember(req);

    if (hasContestPermission(member.contest_permissions, ContestMemberPermissions.VIEW_QUESTIONS))
        return respond(res, StatusCodes.OK, questions);

    return respond(
        res,
        StatusCodes.OK,
        questions.filter((question) => question.contest_member_id === member.id)
    );
});

// Get messages for a thread
ContestQuestionHandler.get("/:question_id/messages", async (req, res) => {
    const questionId = extractIdFromParameters(req, "question_id");
    const user = await extractUser(req);
    const thread = await Database.selectOneFrom("contest_questions", "*", { id: questionId });

    if (!thread) throw new SafeError(StatusCodes.NOT_FOUND);

    const member = await extractContestMember(req, thread.contest_id);

    const isOwner = member.id === thread.contest_member_id;
    const canView = hasContestPermission(
        member.contest_permissions,
        ContestMemberPermissions.VIEW_QUESTIONS,
        user.permissions
    );

    if (!isOwner && !canView) throw new SafeError(StatusCodes.FORBIDDEN);

    const messages = await Database.selectFrom("contest_chat_messages", "*", {
        thread_id: questionId,
    });

    // Resolve author names
    const uniqueMemberIds = [...new Set(messages.map((m) => m.author_member_id))];

    const memberRows = await Promise.all(
        uniqueMemberIds.map((id) =>
            Database.selectOneFrom("contest_members", ["id", "user_id"], { id })
        )
    );

    const userIds = memberRows.filter(Boolean).map((m) => m!.user_id);

    const users =
        userIds.length > 0
            ? await Database.selectFrom("users", ["id", "full_name"], {
                  id: eqIn(...userIds),
              })
            : [];

    const nameMap = new Map<string, string>();

    for (const memberRow of memberRows) {
        if (!memberRow) continue;

        const u = users.find((usr) => usr.id === memberRow.user_id);

        if (u) nameMap.set(memberRow.id.toString(), u.full_name);
    }

    return respond(
        res,
        StatusCodes.OK,
        messages
            .sort((a, b) => Number(a.id - b.id))
            .map((m) => ({
                ...m,
                author_name: nameMap.get(m.author_member_id.toString()) ?? undefined,
            }))
    );
});

const MessageSchema = Type.Object({
    content: Type.String(),
});

// Send a message in a thread
ContestQuestionHandler.post(
    "/:question_id/messages",
    useValidation(MessageSchema),
    async (req, res) => {
        const questionId = extractIdFromParameters(req, "question_id");
        const user = await extractUser(req);
        const thread = await Database.selectOneFrom("contest_questions", "*", { id: questionId });
        const contest = await extractContest(req);

        if (!thread) throw new SafeError(StatusCodes.NOT_FOUND);

        const member = await extractContestMember(req, thread.contest_id);

        const isOwner = member.id === thread.contest_member_id;
        const canAnswer = hasContestPermission(
            member.contest_permissions,
            ContestMemberPermissions.ANSWER_QUESTIONS,
            user.permissions
        );

        if (!isOwner && !canAnswer) throw new SafeError(StatusCodes.FORBIDDEN);

        const now = new Date();

        const message: ContestChatMessage = {
            id: generateSnowflake(),
            thread_id: questionId,
            contest_id: thread.contest_id,
            author_member_id: member.id,
            content: req.body.content,
            created_at: now,
        };

        await Promise.all([
            Database.insertInto("contest_chat_messages", message),
            Database.update(
                "contest_questions",
                { last_message_at: now, last_message_member_id: member.id },
                { id: thread.id }
            ),
        ]);

        // Notify the other side
        if (isOwner) {
            // Member sent a message -> notify management
            const members = await Database.selectFrom(
                "contest_members",
                ["user_id", "contest_permissions"],
                { contest_id: thread.contest_id }
            );

            const privileged = members.filter((m) =>
                hasContestPermission(m.contest_permissions, ContestMemberPermissions.VIEW_QUESTIONS)
            );

            const _ = pushNotificationsToMany(
                { type: "new-question", data: contest.name },
                privileged.map((it) => it.user_id)
            );
        } else {
            // Management sent a message -> notify thread owner
            const targetMember = await Database.selectOneFrom("contest_members", ["user_id"], {
                id: thread.contest_member_id,
            });

            if (targetMember) {
                const _ = pushNotificationsToMany({ type: "question-answer", data: contest.name }, [
                    targetMember.user_id,
                ]);
            }
        }

        return respond(res, StatusCodes.OK, message);
    }
);

// Legacy: answer a question (kept for backward compatibility)
const QuestionAnswerSchema = Type.Object({
    response: Type.String(),
});

ContestQuestionHandler.patch(
    "/:question_id",
    useValidation(QuestionAnswerSchema),
    async (req, res) => {
        const questionId = extractIdFromParameters(req, "question_id");
        const user = await extractUser(req);
        const question = await Database.selectOneFrom("contest_questions", "*", { id: questionId });

        const contest = await extractContest(req);

        if (!question) throw new SafeError(StatusCodes.NOT_FOUND);

        const member = await extractContestMember(req, question.contest_id);

        if (
            !hasContestPermission(
                member.contest_permissions,
                ContestMemberPermissions.ANSWER_QUESTIONS,
                user.permissions
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

        const targetMember = await Database.selectOneFrom("contest_members", ["user_id"], {
            id: question.contest_member_id,
        });

        if (!targetMember) throw new SafeError(StatusCodes.INTERNAL_SERVER_ERROR);

        const _ = pushNotificationsToMany(
            {
                type: "question-answer",
                data: contest.name,
            },
            [targetMember.user_id]
        );

        return respond(res, StatusCodes.OK);
    }
);

export default ContestQuestionHandler;
