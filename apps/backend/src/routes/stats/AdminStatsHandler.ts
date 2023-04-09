import { Router } from "express";

import { MetricsHandlers } from "./MetricsHandlers";

const AdminStatsHandler = Router();

AdminStatsHandler.use("/metrics", MetricsHandlers);

AdminStatsHandler.get("/logins", (req, res) => {});

AdminStatsHandler.get("/activity", (req, res) => {});

export { AdminStatsHandler };
