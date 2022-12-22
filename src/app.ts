import { config as dotenvConfig } from "dotenv";
import Express, { json } from "express";

import { DataBase, initDatabase } from "./data/Database";
import { Logger } from "./lib/logger";

dotenvConfig();

const app = Express();

app.use(json());

app.use((req, res, next) => {
    Logger.info(req.method + " ON " + req.url);
    next();
});

app.get("/", (req, res) => res.send({ status: 200 }));


DataBase.awaitConnection().then(async () => {
    Logger.info("Successfully connected to database!");
    await initDatabase();
    Logger.info("Initialized database!");
});


const _PORT = process.env.PORT || 8080;
app.listen(_PORT, () => Logger.info("Listening on " + _PORT));
