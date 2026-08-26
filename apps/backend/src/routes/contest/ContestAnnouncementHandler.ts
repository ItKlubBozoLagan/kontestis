import { ContestAnnouncement, ContestMemberPermissions } from "@kontestis/models";
import { Type } from "@sinclair/typebox";
import { Router } from "express";
import { StatusCodes } from "http-status-codes";

import { extractContest } from "../../extractors/extractContest";
import { pushNotificationsToMany } from "../../lib/notifications";
import { generateSnowflake } from "../../lib/snowflake";
import { useValidation } from "../../middlewares/useValidation";
import { mustHaveContestPermission } from "../../preconditions/hasPermission";
import { Repositories } from "../../repositories/Repositories";
import { respond } from "../../utils/response";

const ContestAnnouncementHandler = Router({ mergeParams: true });

const AnnouncementSchema = Type.Object({
    message: Type.String(),
});

ContestAnnouncementHandler.post("/", useValidation(AnnouncementSchema), async (req, res) => {
    const contest = await extractContest(req);

    await mustHaveContestPermission(req, ContestMemberPermissions.CREATE_ANNOUNCEMENT);

    const contestAnnouncement: ContestAnnouncement = {
        id: generateSnowflake(),
        contest_id: contest.id,
        message: req.body.message,
    };

    await Repositories.contest_announcements.insert(contestAnnouncement);

    const members = await Repositories.contest_members.select(["user_id"], {
        contest_id: contest.id,
    });

    const _ = pushNotificationsToMany(
        {
            type: "new-announcement",
            data: contest.name,
        },
        members.map((it) => it.user_id)
    );

    return respond(res, StatusCodes.OK, contestAnnouncement);
});

ContestAnnouncementHandler.get("/", async (req, res) => {
    const contest = await extractContest(req);

    const announcements = await Repositories.contest_announcements.select("*", {
        contest_id: contest.id,
    });

    return respond(res, StatusCodes.OK, announcements);
});

export default ContestAnnouncementHandler;
