import { AdminPermissions, hasAdminPermission } from "@kontestis/models";
import { Type } from "@sinclair/typebox";
import { Router } from "express";
import { StatusCodes } from "http-status-codes";

import { SafeError } from "../../errors/SafeError";
import { extractUser } from "../../extractors/extractUser";
import { generateGravatarUrl, generateJwt } from "../../lib/auth";
import { processUserFromTokenData, verifyToken } from "../../lib/google";
import { useValidation } from "../../middlewares/useValidation";
import { Repositories } from "../../repositories/Repositories";
import { extractIdFromParameters } from "../../utils/extractorUtils";
import { respond } from "../../utils/response";
import { AaiEduHandler } from "./AaiEduHandler";
import ManagedHandler from "./ManagedHandler";
import TemporaryHandler from "./TemporaryHandler";

const AuthHandler = Router();

AuthHandler.use("/aai-edu", AaiEduHandler);
AuthHandler.use("/managed", ManagedHandler);
AuthHandler.use("/temporary", TemporaryHandler);

const OAuthSchema = Type.Object({
    credential: Type.String(),
});

// TODO: organize better
AuthHandler.post("/google-login", useValidation(OAuthSchema), async (req, res) => {
    const { credential } = req.body;

    const googleResponse = await verifyToken(credential).catch(() => null);

    if (googleResponse === null) throw new SafeError(StatusCodes.FORBIDDEN);

    const tokenData = await processUserFromTokenData(googleResponse);

    await Repositories.users.update(
        {
            full_name: tokenData.full_name,
            picture_url: tokenData.picture_url || generateGravatarUrl(tokenData.email),
        },
        {
            id: tokenData.id,
        }
    );

    const jwt = generateJwt(tokenData.id, "google", {});

    respond(res, StatusCodes.OK, { token: jwt });
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

    const userData = await Repositories.users.selectOne("*", { id: id });

    if (!userData) throw new SafeError(StatusCodes.NOT_FOUND);

    respond(res, StatusCodes.OK, { ...userData });
});

AuthHandler.get("/", async (req, res) => {
    const user = await extractUser(req);

    if (!hasAdminPermission(user.permissions, AdminPermissions.VIEW_USER))
        throw new SafeError(StatusCodes.FORBIDDEN);

    const users = await Repositories.users.select("*", {});

    return respond(res, StatusCodes.OK, users);
});

const UserSearchSchema = Type.Object({
    search: Type.Optional(Type.String({ maxLength: 256 })),
    limit: Type.Optional(Type.String({ pattern: "^\\d{1,3}$" })),
    offset: Type.Optional(Type.String({ pattern: "^\\d{1,9}$" })),
    sort: Type.Optional(
        Type.Union([Type.Literal("name"), Type.Literal("email"), Type.Literal("newest")])
    ),
});

// paginated, searchable alternative to GET / for large user bases
AuthHandler.get("/users", useValidation(UserSearchSchema, { query: true }), async (req, res) => {
    const user = await extractUser(req);

    if (!hasAdminPermission(user.permissions, AdminPermissions.VIEW_USER))
        throw new SafeError(StatusCodes.FORBIDDEN);

    const search = req.query.search?.trim();

    return respond(
        res,
        StatusCodes.OK,
        await Repositories.users.search({
            search: search && search.length > 0 ? search : undefined,
            limit: Math.min(Math.max(Number(req.query.limit ?? 25), 1), 200),
            offset: Number(req.query.offset ?? 0),
            sort: req.query.sort ?? "name",
        })
    );
});

AuthHandler.patch("/:user_id", async (req, res) => {
    const user = await extractUser(req);

    const targetId = extractIdFromParameters(req, "user_id");

    if (!hasAdminPermission(user.permissions, AdminPermissions.EDIT_USER))
        throw new SafeError(StatusCodes.FORBIDDEN);

    const target = await Repositories.users.selectOne(["id"], { id: targetId });

    if (!target) throw new SafeError(StatusCodes.NOT_FOUND);

    const newPermissions = req.body.permissions ? BigInt(req.body.permissions) : undefined;

    if (typeof newPermissions === "undefined") throw new SafeError(StatusCodes.BAD_REQUEST);

    await Repositories.users.update({ permissions: newPermissions }, { id: target.id });

    return respond(res, StatusCodes.OK);
});

export default AuthHandler;
