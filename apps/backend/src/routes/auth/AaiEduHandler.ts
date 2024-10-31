import { Type } from "@sinclair/typebox";
import { Router } from "express";
import { StatusCodes } from "http-status-codes";

import { SafeError } from "../../errors/SafeError";
import { extractOptionalUser } from "../../extractors/extractOptionalUser";
import { Globals } from "../../globals";
import { aaiEduExchangeAuthorizationToken, AaiEduOpenIdConfiguration } from "../../lib/aaiedu";
import { linkEduUser, loginEduUser } from "../../lib/eduAccounts";
import { useValidation } from "../../middlewares/useValidation";
import { respond } from "../../utils/response";

const AaiEduHandler = Router();

const TokenSchema = Type.Object({
    authorization_code: Type.String(),
});

const ParametersSchema = Type.Object({
    purpose: Type.Union([Type.Literal("login"), Type.Literal("link")]),
});

AaiEduHandler.get("/url", useValidation(ParametersSchema, { query: true }), (req, res) => {
    const base = AaiEduOpenIdConfiguration.authorization_endpoint.split("?").at(0)!;

    const query = new URLSearchParams();

    query.set("response_type", "code");
    query.set("client_id", Globals.aaiEduClientId);
    query.set("redirect_uri", Globals.aaiEduRedirectUri);
    query.set("scope", Globals.aaiEduScopes.join(" "));
    query.set("state", req.query.purpose);
    query.set(
        "claims",
        JSON.stringify({
            id_token: Object.fromEntries(Globals.aaiEduScopes.map((it) => [it, null])),
        })
    );

    const url = `${base}?${query.toString()}`;

    respond(res, StatusCodes.OK, {
        url,
    });
});

AaiEduHandler.post("/token", useValidation(TokenSchema), async (req, res) => {
    const user = await extractOptionalUser(req);

    const exchanged = await aaiEduExchangeAuthorizationToken(req.body.authorization_code);

    if (!exchanged.success) throw new SafeError(StatusCodes.BAD_REQUEST);

    if (!user) {
        const tokenData = await loginEduUser(exchanged.data);

        return respond(res, StatusCodes.OK, tokenData);
    }

    const tokenData = await linkEduUser(user, exchanged.data);

    return respond(res, StatusCodes.OK, tokenData);
});

export { AaiEduHandler };
