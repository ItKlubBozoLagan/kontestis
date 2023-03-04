import { ContestMemberPermissions, ContestQuestion, hasContestPermission } from "@kontestis/models";
import { Type } from "@sinclair/typebox";
import { Router } from "express";
import { StatusCodes } from "http-status-codes";

import { Database } from "../../database/Database";
import { SafeError } from "../../errors/SafeError";
import { extractContestMember } from "../../extractors/extractContestMember";
import { generateSnowflake } from "../../lib/snowflake";
import { useValidation } from "../../middlewares/useValidation";
import { extractIdFromParameters } from "../../utils/extractorUtils";
import { respond } from "../../utils/response";

const ContestQuestionHandler = Router({ mergeParams: true });

const questionSchema = Type.Object({
    question: Type.String(),
});

ContestQuestionHandler.post("/", useValidation(questionSchema), async (req, res) => {
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

ContestQuestionHandler.get("/", async (req, res) => {
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

ContestQuestionHandler.patch(
    "/:question_id",
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

export default ContestQuestionHandler;
