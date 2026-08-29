import { Router } from "express";

import { GrafanaSessionHandler } from "./GrafanaSessionHandler";
import { MetricsHandlers } from "./MetricsHandlers";

const AdminStatsHandler = Router();

AdminStatsHandler.use("/metrics", MetricsHandlers);
AdminStatsHandler.use("/grafana", GrafanaSessionHandler);

export { AdminStatsHandler };
