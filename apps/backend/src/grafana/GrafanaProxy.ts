import { randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";

import { Router } from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import { StatusCodes } from "http-status-codes";
import jsonwebtoken from "jsonwebtoken";

import { Globals } from "../globals";
import { Redis } from "../redis/Redis";
import { RedisKeys } from "../redis/RedisKeys";
import { reject } from "../utils/response";

const SESSION_COOKIE = "kontestis_grafana_session";
const SESSION_DURATION_SECONDS = 60 * 60;

type GrafanaSession = {
    userId: string;
};

declare global {
    namespace Express {
        interface Request {
            grafanaSession?: GrafanaSession;
        }
    }
}

const parseCookies = (header: string | undefined): Record<string, string> =>
    Object.fromEntries(
        (header ?? "")
            .split(";")
            .map((part) => part.trim().split("="))
            .filter(([key, value]) => key && value)
            .map(([key, value]) => [key, decodeURIComponent(value)])
    );

const loadPrivateKey = () => {
    if (!Globals.grafanaJwtPrivateKeyPath) throw new Error("Grafana JWT key is not configured");

    return readFileSync(Globals.grafanaJwtPrivateKeyPath);
};

const grafanaPrivateKey = Globals.grafanaEnabled ? loadPrivateKey() : undefined;

const GrafanaProxy = Router();

GrafanaProxy.get("/session/:ticket", async (request, response) => {
    if (!Globals.grafanaEnabled)
        return reject(response, StatusCodes.SERVICE_UNAVAILABLE, "grafana-disabled");

    const ticketData = await Redis.getDel(RedisKeys.GRAFANA_EMBED_TICKET(request.params.ticket));

    if (!ticketData) return reject(response, StatusCodes.UNAUTHORIZED);

    const session = randomBytes(32).toString("base64url");

    await Redis.set(RedisKeys.GRAFANA_EMBED_SESSION(session), ticketData, {
        EX: SESSION_DURATION_SECONDS,
    });

    response.header("Cache-Control", "no-store");
    response.header("Referrer-Policy", "no-referrer");
    response.cookie(SESSION_COOKIE, session, {
        httpOnly: true,
        secure: Globals.mode === "production",
        sameSite: "lax",
        path: "/grafana",
        maxAge: SESSION_DURATION_SECONDS * 1000,
    });

    return response.redirect(`${Globals.grafanaPublicUrl}${Globals.grafanaDashboardPath}`);
});

GrafanaProxy.use(async (request, response, next) => {
    if (!Globals.grafanaEnabled)
        return reject(response, StatusCodes.SERVICE_UNAVAILABLE, "grafana-disabled");

    const sessionId = parseCookies(request.headers.cookie)[SESSION_COOKIE];
    const serializedSession = sessionId
        ? await Redis.get(RedisKeys.GRAFANA_EMBED_SESSION(sessionId))
        : null;

    if (!serializedSession) return reject(response, StatusCodes.UNAUTHORIZED);

    request.grafanaSession = JSON.parse(serializedSession) as GrafanaSession;
    await Redis.expire(RedisKeys.GRAFANA_EMBED_SESSION(sessionId), SESSION_DURATION_SECONDS);

    return next();
});

GrafanaProxy.use(
    createProxyMiddleware({
        target: Globals.grafanaInternalUrl,
        changeOrigin: true,
        ws: false,
        pathRewrite: (path) => `/grafana${path}`,
        onProxyReq: (proxyRequest, request) => {
            proxyRequest.removeHeader("X-Kontestis-Grafana-JWT");

            const session = request.grafanaSession;

            if (!session) return;

            const token = jsonwebtoken.sign(
                {
                    sub: `kontestis:${session.userId}`,
                    role: "Viewer",
                },
                grafanaPrivateKey!,
                {
                    algorithm: "RS256",
                    expiresIn: 60,
                    issuer: Globals.grafanaJwtIssuer,
                    audience: Globals.grafanaJwtAudience,
                }
            );

            proxyRequest.setHeader("X-Kontestis-Grafana-JWT", token);
        },
    })
);

export { GrafanaProxy };
