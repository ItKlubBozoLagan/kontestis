import * as querystring from "node:querystring";

import { Type } from "@sinclair/typebox";
import axios, { AxiosError } from "axios";
import { Router } from "express";
import { StatusCodes } from "http-status-codes";
import * as R from "remeda";

import { Database } from "../database/Database";
import { SafeError } from "../errors/SafeError";
import { extractUser } from "../extractors/extractUser";
import { Globals } from "../globals";
import { useValidation } from "../middlewares/useValidation";
import {
    AdminPermissions,
    hasAdminPermission,
} from "../permissions/AdminPermissions";
import { respond } from "../utils/response";

const AuthHandler = Router();

const oauthSchema = Type.Object({
    code: Type.String(),
    hd: Type.Optional(Type.String()),
});

AuthHandler.post(
    "/google-login",
    useValidation(oauthSchema),
    async (req, res) => {
        const { hd: hostedDomain } = req.body;

        if (
            !hostedDomain ||
            !Globals.oauthAllowedDomains.includes(hostedDomain)
        )
            throw new SafeError(StatusCodes.FORBIDDEN);

        console.log("ruri", Globals.oauthRedirectUri);
        const accessTokenResponse = await axios
            .post(
                "https://oauth2.googleapis.com/token",
                querystring.stringify({
                    client_id: Globals.oauthClientId,
                    client_secret: Globals.oauthClientSecret,
                    code: req.body.code,
                    grant_type: "authorization_code",
                    redirect_uri: Globals.oauthRedirectUri,
                }),
                {
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded",
                    },
                }
            )
            .catch((error: AxiosError) => {
                console.log(error.response?.data);

                return null;
            });

        console.log(accessTokenResponse);

        if (accessTokenResponse === null)
            throw new SafeError(StatusCodes.FORBIDDEN);

        console.log(accessTokenResponse);
        respond(res, StatusCodes.OK);
    }
);

AuthHandler.get("/info", async (req, res) => {
    const user = await extractUser(req);

    return respond(res, StatusCodes.OK, R.omit(user, ["password"]));
});

AuthHandler.get("/info/:id", async (req, res) => {
    const user = await extractUser(req);

    if (!hasAdminPermission(user.permissions, AdminPermissions.VIEW_USER))
        throw new SafeError(StatusCodes.FORBIDDEN);

    const searchUser = await Database.selectOneFrom("users", "*", {
        id: req.params.id,
    });

    if (!searchUser) throw new SafeError(StatusCodes.NOT_FOUND);

    return respond(res, StatusCodes.OK, R.omit(searchUser, ["password"]));
});

export default AuthHandler;
