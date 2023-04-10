import { AdminPermissions } from "@kontestis/models";
import { Router } from "express";
import { StatusCodes } from "http-status-codes";
import { hasPermission } from "permissio";

import { SafeError } from "../../errors/SafeError";
import { extractUser } from "../../extractors/extractUser";
import { AdminStatsHandler } from "./AdminStatsHandler";

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

StatsHandler.get("/elo", (req, res) => {});

StatsHandler.get("/submissions", (req, res) => {});

export { StatsHandler };
