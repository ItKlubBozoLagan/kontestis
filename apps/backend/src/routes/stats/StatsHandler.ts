import { AdminPermissions } from "@kontestis/models";
import { Router } from "express";
import { StatusCodes } from "http-status-codes";
import { hasPermission } from "permissio";

import { Database } from "../../database/Database";
import { SafeError } from "../../errors/SafeError";
import { extractCurrentOrganisation } from "../../extractors/extractOrganisation";
import { extractOrganisationMember } from "../../extractors/extractOrganisationMember";
import { extractUser } from "../../extractors/extractUser";
import { useValidation } from "../../middlewares/useValidation";
import { respond } from "../../utils/response";
import { reconstructEloStatistics } from "../../utils/stats";
import { AdminStatsHandler } from "./AdminStatsHandler";
import { RangeQuerySchema } from "./schemas";

const StatsHandler = Router();

StatsHandler.use(
    "/admin",
    async (req, _, next) => {
        const user = await extractUser(req);

        if (!hasPermission(user.permissions, AdminPermissions.ADMIN))
            throw new SafeError(StatusCodes.FORBIDDEN);

        next();
    },
    AdminStatsHandler
);

StatsHandler.get("/elo", useValidation(RangeQuerySchema, { query: true }), async (req, res) => {
    const user = await extractUser(req);
    const organisation = await extractCurrentOrganisation(req);
    const member = await extractOrganisationMember(req, organisation.id);

    const { range } = req.query;
    const history = await Database.selectFrom("elo_history", "*", {
        user_id: user.id,
        organisation_id: organisation.id,
    });

    respond(res, StatusCodes.OK, reconstructEloStatistics(member.elo, history, range));
});

export { StatsHandler };
