import { config as dotenvConfig } from "dotenv";
import Express, { json } from "express";

// We must load .env first so the database has correct details.
dotenvConfig();

import cors from "cors";

import { Database, initDatabase } from "./database/Database";
import { Logger } from "./lib/logger";
import AuthHandler from "./routes/AuthHandler";
import ContestHandler from "./routes/ContestHandler";
import ProblemHandler from "./routes/ProblemHandler";
import SubmissionHandler from "./routes/SubmissionHandler";

const app = Express();

app.use(json());
app.use(cors());

app.use("/api/auth", AuthHandler);
app.use("/api/contest", ContestHandler);
app.use("/api/problem", ProblemHandler);
app.use("/api/submission", SubmissionHandler);

app.use((request, res, next) => {
    Logger.info(request.method + " ON " + request.url);
    next();
});

app.get("/", (request, res) => res.send({ status: 200 }));

Database.awaitConnection().then(async () => {
    Logger.info("Successfully connected to database!");
    await initDatabase();
    Logger.info("Initialized database!");
});

const _PORT = process.env.PORT || 8080;

app.listen(_PORT, () => Logger.info("Listening on " + _PORT));
