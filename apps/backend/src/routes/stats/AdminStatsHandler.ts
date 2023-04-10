import { Type } from "@sinclair/typebox";
import { Router } from "express";
import { StatusCodes } from "http-status-codes";

import { Influx } from "../../influx/Influx";
import { useValidation } from "../../middlewares/useValidation";
import { respond } from "../../utils/response";
import { getWindowFromRange } from "../../utils/stats";
import { BooleanStringSchema } from "../../utils/types";
import { MetricsHandlers } from "./MetricsHandlers";
import { RangeQuerySchema } from "./schemas";

const AdminStatsHandler = Router();

AdminStatsHandler.use("/metrics", MetricsHandlers);

AdminStatsHandler.get(
    "/logins",
    useValidation(
        Type.Intersect([
            RangeQuerySchema,
            Type.Object({
                unique: Type.Optional(BooleanStringSchema),
            }),
        ]),
        { query: true }
    ),
    async (req, res) => {
        const { range, unique } = req.query;

        respond(
            res,
            StatusCodes.OK,
            await Influx.aggregateCountPerWindow(
                "logins",
                getWindowFromRange(range),
                unique ? { newLogin: unique } : undefined,
                `-${range}`
            )
        );
    }
);

AdminStatsHandler.get(
    "/activity",
    useValidation(RangeQuerySchema, { query: true }),
    async (req, res) => {
        const { range } = req.query;

        respond(
            res,
            StatusCodes.OK,
            await Influx.aggregateCountPerWindow(
                "activity",
                getWindowFromRange(range),
                undefined,
                `-${range}`
            )
        );
    }
);

export { AdminStatsHandler };
