import {
    AdminPermissions,
    ContestMemberPermissions,
    ExamGradingScale,
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
import { extractModifiableContest } from "../../extractors/extractModifiableContest";
import { extractUser } from "../../extractors/extractUser";
import { generateSnowflake } from "../../lib/snowflake";
import { useValidation } from "../../middlewares/useValidation";
import { respond } from "../../utils/response";

const ContestGradingHandler = Router({ mergeParams: true });

const GradingSchema = Type.Object({
    percentage: Type.Number(),
    grade: Type.String(),
});

ContestGradingHandler.get("/", async (req, res) => {
    const user = await extractUser(req);
    const contest = await extractContest(req);

    const gradingScales = await Database.selectFrom("exam_grading_scales", "*", {
        contest_id: contest.id,
    });

    if (hasAdminPermission(user.permissions, AdminPermissions.VIEW_CONTEST))
        return respond(res, StatusCodes.OK, gradingScales);

    const member = await extractContestMember(req);

    if (!hasContestPermission(member.contest_permissions, ContestMemberPermissions.VIEW_PRIVATE)) {
        throw new SafeError(StatusCodes.FORBIDDEN);
    }

    return respond(res, StatusCodes.OK, gradingScales);
});

ContestGradingHandler.post("/", useValidation(GradingSchema), async (req, res) => {
    const contest = await extractModifiableContest(req);

    const gradingScale: ExamGradingScale = {
        id: generateSnowflake(),
        contest_id: contest.id,
        percentage: req.body.percentage,
        grade: req.body.grade,
    };

    await Database.insertInto("exam_grading_scales", gradingScale);

    return respond(res, StatusCodes.OK, gradingScale);
});

// TODO: make an extractor
ContestGradingHandler.patch(
    "/:grading_scale_id",
    useValidation(GradingSchema),
    async (req, res) => {
        const user = await extractUser(req);
        const member = await extractContestMember(req);

        if (
            !hasContestPermission(
                member.contest_permissions,
                ContestMemberPermissions.EDIT,
                user.permissions
            ) &&
            !hasAdminPermission(user.permissions, AdminPermissions.EDIT_CONTEST)
        )
            throw new SafeError(StatusCodes.FORBIDDEN);

        const exists = await Database.selectOneFrom("exam_grading_scales", "*", {
            id: req.params.grading_scale_id,
        });

        if (!exists) throw new SafeError(StatusCodes.NOT_FOUND);

        await Database.update(
            "exam_grading_scales",
            { percentage: req.body.percentage, grade: req.body.grade },
            { id: exists.id }
        );

        return respond(res, StatusCodes.OK);
    }
);

ContestGradingHandler.delete("/:grading_scale_id", async (req, res) => {
    const user = await extractUser(req);
    const member = await extractContestMember(req);

    if (
        !hasContestPermission(
            member.contest_permissions,
            ContestMemberPermissions.EDIT,
            user.permissions
        ) &&
        !hasAdminPermission(user.permissions, AdminPermissions.EDIT_CONTEST)
    )
        throw new SafeError(StatusCodes.FORBIDDEN);

    const exists = await Database.selectOneFrom("exam_grading_scales", "*", {
        id: req.params.grading_scale_id,
    });

    if (!exists) throw new SafeError(StatusCodes.NOT_FOUND);

    await Database.deleteFrom("exam_grading_scales", "*", { id: exists.id });

    return respond(res, StatusCodes.OK, exists);
});

export default ContestGradingHandler;
