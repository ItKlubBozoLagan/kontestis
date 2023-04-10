import { Type } from "@sinclair/typebox";
import { Router } from "express";
import { StatusCodes } from "http-status-codes";

import { Influx } from "../../influx/Influx";
import { InfluxCountResult } from "../../influx/InfluxClient";
import { useValidation } from "../../middlewares/useValidation";
import { respond } from "../../utils/response";
import { fillIfEmpty, getWindowFromRange } from "../../utils/stats";
import { BooleanStringSchema } from "../../utils/types";
import { MetricsHandlers } from "./MetricsHandlers";
import { RangeQuerySchema } from "./schemas";

const AdminStatsHandler = Router();

AdminStatsHandler.use("/metrics", MetricsHandlers);

const calculateDifferencePercentage = (current: number, previous: number): number =>
    previous === 0 ? (current !== 0 ? 9.99 : 0) : current / previous - 1;

const sumCounts = (data: InfluxCountResult) =>
    data.reduce((accumulator, current) => accumulator + current.count, 0);

AdminStatsHandler.get(
    "/logins",
    useValidation(
        Type.Intersect([
            RangeQuerySchema,
            Type.Object({
                unique: Type.Optional(BooleanStringSchema),
                newLogins: Type.Optional(BooleanStringSchema),
            }),
        ]),
        { query: true }
    ),
    async (req, res) => {
        const { range, unique, newLogins } = req.query;

        const stats = fillIfEmpty(
            await Influx.aggregateCountPerWindow(
                "logins",
                getWindowFromRange(range),
                { newLogin: !newLogins || newLogins === "false" ? undefined : "true" },
                `-${range}`,
                unique === "true" ? "userId" : undefined
            ),
            range
        );

        const previousCount = await Influx.totalInRange(
            "logins",
            {
                newLogin: !newLogins || newLogins === "false" ? undefined : "true",
            },
            {
                start: `-${Number(range.slice(0, -1)) * 2}${range.at(-1)}`,
                end: `-${range}`,
            },
            unique === "true" ? "userId" : undefined
        );
        const currentCount = sumCounts(stats);

        respond(res, StatusCodes.OK, {
            stats,
            previousPeriodChange: calculateDifferencePercentage(
                currentCount,
                Number(previousCount)
            ),
        });
    }
);

AdminStatsHandler.get(
    "/activity",
    useValidation(RangeQuerySchema, { query: true }),
    async (req, res) => {
        const { range } = req.query;

        const stats = fillIfEmpty(
            await Influx.aggregateCountPerWindow(
                "activity",
                getWindowFromRange(range),
                undefined,
                `-${range}`
            ),
            range
        );

        const previousCount = await Influx.totalInRange("activity", undefined, {
            start: `-${Number(range.slice(0, -1)) * 2}${range.at(-1)}`,
            end: `-${range}`,
        });
        const currentCount = sumCounts(stats);

        respond(res, StatusCodes.OK, {
            stats,
            previousPeriodChange: calculateDifferencePercentage(
                currentCount,
                Number(previousCount)
            ),
        });
    }
);

export { AdminStatsHandler };
