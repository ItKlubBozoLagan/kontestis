import { Type } from "@sinclair/typebox";
import { Router } from "express";
import { StatusCodes } from "http-status-codes";

import { Database } from "../database/Database";
import { SafeError } from "../errors/SafeError";
import { extractUser } from "../extractors/extractUser";
import { processUserFromTokenData, verifyToken } from "../lib/google";
import { useValidation } from "../middlewares/useValidation";
import {
    AdminPermissions,
    hasAdminPermission,
} from "../permissions/AdminPermissions";
import { respond } from "../utils/response";

const AuthHandler = Router();

const oauthSchema = Type.Object({
    credential: Type.String(),
});

AuthHandler.post(
    "/google-login",
    useValidation(oauthSchema),
    async (req, res) => {
        const { credential } = req.body;

        const googleResponse = await verifyToken(credential).catch(() => null);

        if (googleResponse === null) throw new SafeError(StatusCodes.FORBIDDEN);

        const tokenData = await processUserFromTokenData(googleResponse);

        await Database.update(
            "known_users",
            {
                email: tokenData.email,
                full_name: tokenData.full_name,
                picture_url: tokenData.picture_url,
            },
            {
                user_id: tokenData.id,
            }
        );

        respond(res, StatusCodes.OK);
    }
);

AuthHandler.get("/info", async (req, res) => {
    const user = await extractUser(req);

    return respond(res, StatusCodes.OK, user);
});

AuthHandler.get("/info/:id", async (req, res) => {
    const user = await extractUser(req);

    if (!hasAdminPermission(user.permissions, AdminPermissions.VIEW_USER))
        throw new SafeError(StatusCodes.FORBIDDEN);

    const id = BigInt(req.params.id);

    if (id === user.id) return respond(res, StatusCodes.OK, user);

    const [userData, knownData] = await Promise.all([
        Database.selectOneFrom("known_users", "*", { user_id: id }),
        Database.selectOneFrom("users", "*", { id: id }),
    ]);

    if (!userData || !knownData) throw new SafeError(StatusCodes.NOT_FOUND);

    respond(res, StatusCodes.OK, { ...userData, ...knownData });
});

export default AuthHandler;
