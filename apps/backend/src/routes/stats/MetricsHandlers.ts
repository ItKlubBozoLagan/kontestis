import { AdminPermissions } from "@kontestis/models";
import { Router } from "express";
import { StatusCodes } from "http-status-codes";
import { hasPermission } from "permissio";

import { SafeError } from "../../errors/SafeError";
import { extractUser } from "../../extractors/extractUser";
import { getSystemMetrics } from "../../metrics/metrics";
import { respond } from "../../utils/response";

const MetricsHandlers = Router();

MetricsHandlers.get("/", async (req, res) => {
    const user = await extractUser(req);

    if (!hasPermission(user.permissions, AdminPermissions.ADMIN))
        throw new SafeError(StatusCodes.FORBIDDEN);

    res.header("Cache-Control", "no-cache");
    respond(res, StatusCodes.OK, await getSystemMetrics());
});

export { MetricsHandlers };
