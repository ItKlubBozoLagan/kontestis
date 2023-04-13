import {
    ContestAnnouncement,
    ContestMemberPermissions,
    hasContestPermission,
} from "@kontestis/models";
import { Type } from "@sinclair/typebox";
import { Router } from "express";
import { StatusCodes } from "http-status-codes";

import { Database } from "../../database/Database";
import { SafeError } from "../../errors/SafeError";
import { extractContest } from "../../extractors/extractContest";
import { extractContestMember } from "../../extractors/extractContestMember";
import { pushNotificationsToMany } from "../../lib/notifications";
import { generateSnowflake } from "../../lib/snowflake";
import { useValidation } from "../../middlewares/useValidation";
import { respond } from "../../utils/response";

const ContestAnnouncementHandler = Router({ mergeParams: true });

const announcementSchema = Type.Object({
    message: Type.String(),
});

ContestAnnouncementHandler.post("/", useValidation(announcementSchema), async (req, res) => {
    const member = await extractContestMember(req);
    const contest = await extractContest(req);

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

    const members = await Database.selectFrom("contest_members", ["user_id"], {
        contest_id: member.contest_id,
    });

    const _ = pushNotificationsToMany(
        {
            type: "new-announcement",
            data: contest.name,
        },
        members.filter((it) => it.user_id !== member.user_id).map((it) => it.user_id)
    );

    return respond(res, StatusCodes.OK, contestAnnouncement);
});

ContestAnnouncementHandler.get("/", async (req, res) => {
    const contest = await extractContest(req);

    const announcements = await Database.selectFrom("contest_announcements", "*", {
        contest_id: contest.id,
    });

    return respond(res, StatusCodes.OK, announcements);
});

export default ContestAnnouncementHandler;
