// just for this file
/* eslint-disable simple-import-sort/imports */

import cors from "cors";
import { config as dotenvConfig } from "dotenv";
// We must load .env first so the database has correct details.
dotenvConfig();
import Express, { json, NextFunction, Request, Response } from "express";
import { ReasonPhrases, StatusCodes } from "http-status-codes";
import { Database, initDatabase } from "./database/Database";
import { SafeError } from "./errors/SafeError";
import { Logger } from "./lib/logger";
import AuthHandler from "./routes/auth/AuthHandler";
import ContestHandler from "./routes/contest/ContestHandler";
import ProblemHandler from "./routes/problem/ProblemHandler";
import SubmissionHandler from "./routes/submission/SubmissionHandler";
import { reject, respond } from "./utils/response";
import { Redis } from "./redis/Redis";
import { Globals } from "./globals";
import OrganisationHandler from "./routes/organisation/OrganisationHandler";
import { initInflux } from "./influx/Influx";
import rateLimit from "express-rate-limit";
import { ipFromRequest } from "./utils/request";
import RedisStore from "rate-limit-redis";
import { startEloTask } from "./tasks/eloTask";
import { startInfluxFlushTask } from "./tasks/influxFlushTask";
import { StatsHandler } from "./routes/stats/StatsHandler";
import expressPackageJson from "express/package.json";
import { startEloInfluxTask } from "./tasks/eloInfluxTask";
import { NotificationsHandler } from "./routes/notifications/NotificationsHandler";
import { subscribeToEvaluatorResponseQueue } from "./lib/evaluation_rs";
import { initAaiEdu } from "./lib/aaiedu";
import { initS3 } from "./s3/S3";
import fileUpload from "express-fileupload";

declare global {
    interface BigInt {
        toJSON(): string;
    }
}

BigInt.prototype.toJSON = function () {
    return this.toString();
};

const app = Express();

app.use(cors({ exposedHeaders: ["Content-Disposition"] }));

app.use(
    rateLimit({
        windowMs: 60 * 1000,
        max: Globals.rateLimit,
        standardHeaders: true,
        legacyHeaders: false,
        keyGenerator: ipFromRequest,
        skip: (req) => ["GET", "OPTIONS", "HEAD"].includes(req.method),
        handler: (req, res) =>
            reject(res, StatusCodes.TOO_MANY_REQUESTS, ReasonPhrases.TOO_MANY_REQUESTS),
        store: new RedisStore({
            prefix: "__kontestis_rate_limit",
            sendCommand: async (...redisArguments) => {
                // a weird and stupid hack that will wait for redis to come online before proceeding
                await new Promise<void>((resolve) => {
                    const interval = setInterval(() => {
                        if (!Redis.isReady) return;

                        clearInterval(interval);
                        resolve();
                    }, 100);
                });

                return Redis.sendCommand(redisArguments);
            },
        }),
    })
);

app.use(async (req, res, next) => {
    Logger.debug(req.method + " ON " + req.url);
    next();
});

app.use(fileUpload());

app.use(json({ limit: "50mb" }), (req, _, next) => {
    // json from express@5 yields undefined for empty bodies,
    //  this breaks validation, so we're falling back to an empty object
    if (req.body === undefined) req.body = {};

    next();
});

app.use("/api/auth", AuthHandler);
app.use("/api/organisation", OrganisationHandler);
app.use("/api/contest", ContestHandler);
app.use("/api/problem", ProblemHandler);
app.use("/api/submission", SubmissionHandler);
app.use("/api/stats", StatsHandler);
app.use("/api/notifications", NotificationsHandler);

app.get("/", (req, res) => respond(res, StatusCodes.OK));

app.use(() => {
    throw new SafeError(StatusCodes.NOT_FOUND);
});

app.use((error: Error, _: Request, res: Response, next: NextFunction) => {
    if (!error) return next();

    if (error.name === "SyntaxError") return reject(res, StatusCodes.BAD_REQUEST, "bad json");

    if (error instanceof SafeError) return reject(res, error.code, error.message);

    console.error(error);

    return reject(res, StatusCodes.INTERNAL_SERVER_ERROR, ReasonPhrases.INTERNAL_SERVER_ERROR);
});

Promise.allSettled([
    Database.awaitConnection()
        .then(() =>
            initS3().catch((error) => {
                Logger.panic("S3 failed", error);
            })
        )
        .then(async () => {
            Logger.database("Successfully connected to database!");
            await initDatabase();
            Logger.database("Initialized database!");
        })
        .catch((error) => {
            Logger.panic("Scylla failed", error);
        }),
    Redis.connect()
        .then(async () => {
            Logger.redis("Connected to Redis");
            const _ = subscribeToEvaluatorResponseQueue();

            Logger.redis("Subscribed to evaluator pub sub");
        })
        .catch((error) => {
            Logger.panic("Redis failed", error);
        }),
    // for consistency
    initInflux(),
    initAaiEdu(),
]).then(async () => {
    Logger.info("Ready");

    app.listen(Globals.port, () => {
        Logger.info(`Listening on ${Globals.port} (Express ${expressPackageJson.version})`);

        for (const task of [startEloTask, startInfluxFlushTask, startEloInfluxTask]) task();
    });
});
