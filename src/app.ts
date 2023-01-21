import cors from "cors";
import { config as dotenvConfig } from "dotenv";
import Express, { json, NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

import { Database, initDatabase } from "./database/Database";
import { SafeError } from "./errors/SafeError";
import { Logger } from "./lib/logger";
import AuthHandler from "./routes/AuthHandler";
import ContestHandler from "./routes/ContestHandler";
import ProblemHandler from "./routes/ProblemHandler";
import SubmissionHandler from "./routes/SubmissionHandler";
import { respond } from "./utils/response";

// We must load .env first so the database has correct details.
dotenvConfig();

declare global {
    interface BigInt {
        toJSON(): string;
    }
}

BigInt.prototype.toJSON = function () {
    return this.toString();
};

const app = Express();

app.use((req, res, next) => {
    Logger.info(req.method + " ON " + req.url);
    next();
});

app.use(json());
app.use(cors());

app.use("/api/auth", AuthHandler);
app.use("/api/contest", ContestHandler);
app.use("/api/problem", ProblemHandler);
app.use("/api/submission", SubmissionHandler);

app.get("/", (req, res) => respond(res, StatusCodes.OK));

app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
    if (!error) return next();

    if (error instanceof SafeError) return respond(res, error.code);

    return respond(res, StatusCodes.INTERNAL_SERVER_ERROR);
});

Database.awaitConnection().then(async () => {
    Logger.info("Successfully connected to database!");
    await initDatabase();
    Logger.info("Initialized database!");
});

const _PORT = process.env.PORT || 8080;

app.listen(_PORT, () => Logger.debug("Listening on " + _PORT));
