import { AdminPermissions } from "@kontestis/models";
import { Type } from "@sinclair/typebox";
import { Router } from "express";
import { StatusCodes } from "http-status-codes";
import { hasPermission } from "permissio";

import { SafeError } from "../../errors/SafeError";
import { extractCurrentOrganisation } from "../../extractors/extractOrganisation";
import { extractUser } from "../../extractors/extractUser";
import { Influx } from "../../influx/Influx";
import { useValidation } from "../../middlewares/useValidation";
import { respond } from "../../utils/response";
import { fillIfEmpty, getWindowFromRange } from "../../utils/stats";
import { BooleanStringSchema } from "../../utils/types";
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

    const { range } = req.query;

    respond(
        res,
        StatusCodes.OK,
        fillIfEmpty(
            await Influx.aggregateCountPerWindow(
                "elo",
                getWindowFromRange(range),
                {
                    userId: user.id.toString(),
                    orgId: organisation.id.toString(),
                },
                `-${range}`
            ),
            range
        )
    );
});

StatsHandler.get(
    "/submissions",
    useValidation(
        Type.Intersect([
            RangeQuerySchema,
            Type.Object({
                accepted: Type.Optional(BooleanStringSchema),
            }),
        ]),
        { query: true }
    ),
    async (req, res) => {
        const user = await extractUser(req);
        const organisation = await extractCurrentOrganisation(req);

        const { range, accepted } = req.query;

        respond(
            res,
            StatusCodes.OK,
            fillIfEmpty(
                await Influx.aggregateCountPerWindow(
                    "submissions",
                    getWindowFromRange(range),
                    {
                        userId: user.id.toString(),
                        orgId: organisation.id.toString(),
                        successful: accepted || undefined,
                    },
                    `-${range}`
                ),
                range
            )
        );
    }
);

export { StatsHandler };
