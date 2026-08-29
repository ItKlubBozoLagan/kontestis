import { AuthSource } from "@kontestis/models";
import { Request, Response } from "express";
import { collectDefaultMetrics, Counter, Gauge, Registry } from "prom-client";

export const prometheusRegistry = new Registry();

collectDefaultMetrics({
    prefix: "kontestis_",
    register: prometheusRegistry,
});

const httpRequests = new Counter({
    name: "kontestis_http_requests_total",
    help: "Completed Kontestis API requests",
    labelNames: ["method", "route", "status_code"] as const,
    registers: [prometheusRegistry],
});

const logins = new Counter({
    name: "kontestis_logins_total",
    help: "Successful Kontestis logins and registrations",
    labelNames: ["auth_source", "new_login"] as const,
    registers: [prometheusRegistry],
});

export const legacyPendingEloContests = new Gauge({
    name: "kontestis_elo_legacy_pending_contests",
    help: "Ended contests left unapplied by the legacy ELO pipeline",
    registers: [prometheusRegistry],
});

const routeLabel = (request: Request): string => {
    if (!request.route?.path) return "unmatched";

    const routePath = Array.isArray(request.route.path)
        ? request.route.path.join("|")
        : request.route.path;

    return `${request.baseUrl}${routePath}` || "/";
};

export const trackApiRequest = (request: Request, response: Response) => {
    if (!request.originalUrl.startsWith("/api")) return;

    response.once("finish", () => {
        httpRequests.inc({
            method: request.method,
            route: routeLabel(request),
            status_code: response.statusCode.toString(),
        });
    });
};

export const recordLogin = (authSource: AuthSource, newLogin: boolean) => {
    logins.inc({
        auth_source: authSource,
        new_login: String(newLogin),
    });
};
