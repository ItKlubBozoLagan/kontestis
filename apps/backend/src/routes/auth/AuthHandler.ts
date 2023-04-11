import { AdminPermissions, hasAdminPermission, KnownUserData } from "@kontestis/models";
import { Type } from "@sinclair/typebox";
import { Router } from "express";
import { StatusCodes } from "http-status-codes";
import { eqIn } from "scyllo";

import { Database } from "../../database/Database";
import { SafeError } from "../../errors/SafeError";
import { extractUser } from "../../extractors/extractUser";
import { processUserFromTokenData, verifyToken } from "../../lib/google";
import { useValidation } from "../../middlewares/useValidation";
import { extractIdFromParameters } from "../../utils/extractorUtils";
import { respond } from "../../utils/response";

const AuthHandler = Router();

const oauthSchema = Type.Object({
    credential: Type.String(),
});

AuthHandler.post("/google-login", useValidation(oauthSchema), async (req, res) => {
    const { credential } = req.body;

    const googleResponse = await verifyToken(credential).catch(() => null);

    if (googleResponse === null) throw new SafeError(StatusCodes.FORBIDDEN);

    const tokenData = await processUserFromTokenData(googleResponse, true);

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
});

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

AuthHandler.get("/", async (req, res) => {
    const user = await extractUser(req);

    if (!hasAdminPermission(user.permissions, AdminPermissions.VIEW_USER))
        throw new SafeError(StatusCodes.FORBIDDEN);

    const users = await Database.selectFrom("users", "*", {});

    const knownUsers = await Database.selectFrom("known_users", "*", {
        user_id: eqIn(...users.map((user) => user.id)),
    });

    const knownUsersByUserId: Record<string, KnownUserData> = {};

    for (const knownUser of knownUsers)
        knownUsersByUserId[knownUser.user_id.toString()] = knownUser;

    return respond(
        res,
        StatusCodes.OK,
        users
            .filter((user) => typeof knownUsersByUserId[user.id.toString()] !== "undefined")
            .map((user) => ({
                ...user,
                full_name: knownUsersByUserId[user.id.toString()].full_name,
                email: knownUsersByUserId[user.id.toString()].email,
                picture_url: knownUsersByUserId[user.id.toString()].picture_url,
            }))
    );
});

AuthHandler.patch("/:user_id", async (req, res) => {
    const user = await extractUser(req);

    const targetId = extractIdFromParameters(req, "user_id");

    if (!hasAdminPermission(user.permissions, AdminPermissions.EDIT_USER))
        throw new SafeError(StatusCodes.FORBIDDEN);

    const target = await Database.selectOneFrom("users", "*", { id: targetId }, "ALLOW FILTERING");

    if (!target) throw new SafeError(StatusCodes.NOT_FOUND);

    const newPermissions = req.body.permissions ? BigInt(req.body.permissions) : undefined;

    if (typeof newPermissions === "undefined") throw new SafeError(StatusCodes.BAD_REQUEST);

    await Database.update(
        "users",
        { permissions: newPermissions },
        { id: target.id, google_id: target.google_id }
    );

    return respond(res, StatusCodes.OK);
});

export default AuthHandler;
