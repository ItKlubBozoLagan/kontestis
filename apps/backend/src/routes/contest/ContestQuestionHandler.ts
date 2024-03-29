import {
    AdminPermissions,
    ContestMemberPermissions,
    ContestQuestion,
    hasAdminPermission,
    hasContestPermission,
} from "@kontestis/models";
import { Type } from "@sinclair/typebox";
import { Router } from "express";
import { StatusCodes } from "http-status-codes";

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

ContestQuestionHandler.post("/", useValidation(QuestionSchema), async (req, res) => {
    const member = await extractContestMember(req);
    const contest = await extractContest(req);

    const question: ContestQuestion = {
        id: generateSnowflake(),
        contest_id: member.contest_id,
        question: req.body.question,
        contest_member_id: member.id,
    };

    await Database.insertInto("contest_questions", question);

    const members = await Database.selectFrom(
        "contest_members",
        ["user_id", "contest_permissions"],
        {
            contest_id: member.contest_id,
        }
    );

    // can't really do this filter on the database level
    const privileged = members.filter((member) =>
        hasContestPermission(member.contest_permissions, ContestMemberPermissions.VIEW_QUESTIONS)
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
