import { randomBytes } from "node:crypto";

import { Router } from "express";
import { StatusCodes } from "http-status-codes";

import { SafeError } from "../../errors/SafeError";
import { extractUser } from "../../extractors/extractUser";
import { Globals } from "../../globals";
import { Redis } from "../../redis/Redis";
import { RedisKeys } from "../../redis/RedisKeys";
import { respond } from "../../utils/response";

const GrafanaSessionHandler = Router();

GrafanaSessionHandler.post("/session", async (request, response) => {
    if (!Globals.grafanaEnabled)
        throw new SafeError(StatusCodes.SERVICE_UNAVAILABLE, "grafana-disabled");

    const user = await extractUser(request);
    const ticket = randomBytes(32).toString("base64url");

    await Redis.set(
        RedisKeys.GRAFANA_EMBED_TICKET(ticket),
        JSON.stringify({ userId: user.id.toString() }),
        { EX: 30 }
    );

    response.header("Cache-Control", "no-store");
    respond(response, StatusCodes.CREATED, {
        embedUrl: `${Globals.grafanaPublicUrl}/session/${ticket}`,
    });
});

export { GrafanaSessionHandler };
