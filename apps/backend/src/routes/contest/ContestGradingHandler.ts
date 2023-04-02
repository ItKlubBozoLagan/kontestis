import {
    ContestMemberPermissions,
    ExamGradingScale,
    hasContestPermission,
} from "@kontestis/models";
import { Type } from "@sinclair/typebox";
import { Router } from "express";
import { StatusCodes } from "http-status-codes";

import { Database } from "../../database/Database";
import { SafeError } from "../../errors/SafeError";
import { extractContestMember } from "../../extractors/extractContestMember";
import { generateSnowflake } from "../../lib/snowflake";
import { useValidation } from "../../middlewares/useValidation";
import { respond } from "../../utils/response";

const ContestGradingHandler = Router({ mergeParams: true });

const gradingSchema = Type.Object({
    percentage: Type.Number(),
    grade: Type.String(),
});

ContestGradingHandler.get("/", async (req, res) => {
    const member = await extractContestMember(req);

    if (!hasContestPermission(member.contest_permissions, ContestMemberPermissions.VIEW_PRIVATE))
        throw new SafeError(StatusCodes.FORBIDDEN);

    const gradingScales = await Database.selectFrom("exam_grading_scales", "*", {
        contest_id: member.contest_id,
    });

    return respond(res, StatusCodes.OK, gradingScales);
});

ContestGradingHandler.post("/", useValidation(gradingSchema), async (req, res) => {
    const member = await extractContestMember(req);

    if (!hasContestPermission(member.contest_permissions, ContestMemberPermissions.EDIT))
        throw new SafeError(StatusCodes.FORBIDDEN);

    const gradingScale: ExamGradingScale = {
        id: generateSnowflake(),
        contest_id: member.contest_id,
        percentage: req.body.percentage,
        grade: req.body.grade,
    };

    await Database.insertInto("exam_grading_scales", gradingScale);

    return respond(res, StatusCodes.OK, gradingScale);
});

ContestGradingHandler.delete("/:grading_scale_id", async (req, res) => {
    const member = await extractContestMember(req);

    if (!hasContestPermission(member.contest_permissions, ContestMemberPermissions.EDIT))
        throw new SafeError(StatusCodes.FORBIDDEN);

    const exists = await Database.selectOneFrom("exam_grading_scales", "*", {
        id: req.params.grading_scale_id,
    });

    if (!exists) throw new SafeError(StatusCodes.NOT_FOUND);

    await Database.deleteFrom("exam_grading_scales", "*", { id: exists.id });

    return respond(res, StatusCodes.OK, exists);
});

export default ContestGradingHandler;
