import { AdminPermissions, DEFAULT_ELO } from "@kontestis/models";
import { Type } from "@sinclair/typebox";
import { Router } from "express";
import { StatusCodes } from "http-status-codes";
import { hasPermission } from "permissio";

import { SafeError } from "../../errors/SafeError";
import { extractCurrentOrganisation } from "../../extractors/extractOrganisation";
import { extractUser } from "../../extractors/extractUser";
import { Influx } from "../../influx/Influx";
import { useValidation } from "../../middlewares/useValidation";
import { R } from "../../utils/remeda";
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

    const stats = fillIfEmpty(
        await Influx.aggregateLastPerWindow(
            "elo",
            getWindowFromRange(range),
            {
                userId: user.id.toString(),
                orgId: organisation.id.toString(),
            },
            `-${range}`
        ),
        "last",
        range
    );

    const lastBefore = await Influx.lastNumberInRange(
        "elo",
        {
            userId: user.id.toString(),
            orgId: organisation.id.toString(),
        },
        {
            start: new Date(0),
            end: `-${range}`,
        }
    );

    const starting = lastBefore === -1 ? DEFAULT_ELO : lastBefore;

    let lastEncountered = 0;

    for (const stat of R.reverse(stats)) {
        if (stat.last === 0) {
            stat.last = lastEncountered === 0 ? starting : lastEncountered;
            continue;
        }

        lastEncountered = stat.last;
    }

    respond(res, StatusCodes.OK, stats);
});

StatsHandler.get(
    "/submissions",
    useValidation(
        Type.Object({
            accepted: Type.Optional(BooleanStringSchema),
        }),
        { query: true }
    ),
    async (req, res) => {
        const user = await extractUser(req);
        const organisation = await extractCurrentOrganisation(req);

        const { accepted } = req.query;

        respond(
            res,
            StatusCodes.OK,
            await Influx.aggregateCountPerWindow(
                "submissions",
                "1d",
                {
                    userId: user.id.toString(),
                    orgId: organisation.id.toString(),
                    successful: !accepted || accepted === "false" ? undefined : accepted,
                },
                "-1y"
            )
        );
    }
);

export { StatsHandler };
