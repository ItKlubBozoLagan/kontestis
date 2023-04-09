import { Router } from "express";

import { AdminStatsHandler } from "./AdminStatsHandler";

const StatsHandler = Router();

StatsHandler.use("/admin", AdminStatsHandler);

StatsHandler.get("/elo", (req, res) => {});

StatsHandler.get("/submissions", (req, res) => {});

export { StatsHandler };
