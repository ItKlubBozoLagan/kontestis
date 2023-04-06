// just for this file
/* eslint-disable simple-import-sort/imports */

import cors from "cors";
import { config as dotenvConfig } from "dotenv";
// We must load .env first so the database has correct details.
dotenvConfig();
import Express, { json, NextFunction, Request, Response } from "express";
require("express-async-errors");

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

app.use((req, res, next) => {
    Logger.debug(req.method + " ON " + req.url);
    next();
});

app.use(json());

app.use("/api/auth", AuthHandler);
app.use("/api/organisation", OrganisationHandler);
app.use("/api/contest", ContestHandler);
app.use("/api/problem", ProblemHandler);
app.use("/api/submission", SubmissionHandler);

app.get("/", (req, res) => respond(res, StatusCodes.OK));

app.use(() => {
    throw new SafeError(StatusCodes.NOT_FOUND);
});

app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
    if (!error) return next();

    if (error.name === "SyntaxError") return reject(res, StatusCodes.BAD_REQUEST, "bad json");

    if (error instanceof SafeError) return reject(res, error.code, error.message);

    if (Globals.mode === "development") console.error(error);

    return reject(res, StatusCodes.INTERNAL_SERVER_ERROR, ReasonPhrases.INTERNAL_SERVER_ERROR);
});

Promise.allSettled([
    Database.awaitConnection()
        .then(async () => {
            Logger.database("Successfully connected to database!");
            await initDatabase();
            Logger.database("Initialized database!");
        })
        .catch((error) => {
            Logger.panic("Scylla failed", error);
        }),
    Redis.connect()
        .then(() => {
            Logger.redis("Connected to Redis");
        })
        .catch((error) => {
            Logger.panic("Redis failed", error);
        }),
    // for consistency
    initInflux(),
]).then(() => {
    Logger.info("Ready");

    const _PORT = process.env.PORT || 8080;

    app.listen(_PORT, () => {
        Logger.info("Listening on " + _PORT);
        const _ = startEloTask();
    });
});
