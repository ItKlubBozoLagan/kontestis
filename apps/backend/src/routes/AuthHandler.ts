import { User } from "@kontestis/models";
import { Type } from "@sinclair/typebox";
import { compare, hash } from "bcrypt";
import { Request, Router } from "express";
import { StatusCodes } from "http-status-codes";
import { sign } from "jsonwebtoken";
import * as R from "remeda";

import { Database } from "../database/Database";
import { SafeError } from "../errors/SafeError";
import { extractUser } from "../extractors/extractUser";
import { Globals } from "../globals";
import { generateSnowflake } from "../lib/snowflake";
import { useValidation } from "../middlewares/useValidation";
import {
    AdminPermissions,
    hasAdminPermission,
} from "../permissions/AdminPermissions";
import { respond } from "../utils/response";

const AuthHandler = Router();

const registerSchema = Type.Object({
    email: Type.String({ minLength: 5, maxLength: 50 }),
    username: Type.String({ minLength: 5, maxLength: 50 }),
    password: Type.String({ minLength: 5, maxLength: 50 }),
});

const loginSchema = Type.Object({
    email: Type.String(),
    password: Type.String(),
});

AuthHandler.post(
    "/register",
    useValidation(registerSchema, { body: true }),
    async (req: Request, res) => {
        const user = await Database.selectOneFrom("users", "*", {
            email: req.body.email,
        });

        if (user) throw new SafeError(StatusCodes.BAD_REQUEST);

        const hashPassword = await hash(req.body.password, 10);

        const newUser: User = {
            id: generateSnowflake(),
            email: req.body.email,
            username: req.body.username,
            password: hashPassword,
            permissions: 0n,
        };

        await Database.insertInto("users", newUser);

        return respond(res, StatusCodes.OK, newUser);
    }
);

AuthHandler.post(
    "/login",
    useValidation(loginSchema, { body: true }),
    async (req, res) => {
        const user = await Database.selectOneFrom("users", "*", {
            email: req.body.email,
        });

        if (!user) throw new SafeError(StatusCodes.BAD_REQUEST);

        const validPassword = await compare(req.body.password, user.password);

        if (!validPassword) throw new SafeError(StatusCodes.BAD_REQUEST);

        const token = sign({ _id: user.id }, Globals.tokenSecret);

        respond(res, StatusCodes.OK, { token });
    }
);

const updateSchema = Type.Object({
    email: Type.String({ minLength: 5, maxLength: 50 }),
    username: Type.String({ minLength: 5, maxLength: 50 }),
    password: Type.Optional(Type.String({ minLength: 5, maxLength: 50 })),
    currentPassword: Type.String(),
});

AuthHandler.patch("/", useValidation(updateSchema), async (req, res) => {
    const user = await extractUser(req);

    if (!(await compare(req.body.currentPassword, user.password)))
        throw new SafeError(StatusCodes.FORBIDDEN);

    const hashPassword = await hash(req.body.password ?? user.password, 10);

    await Database.update(
        "users",
        {
            username: req.body.username,
            password: hashPassword,
            email: req.body.email,
        },
        { id: user.id }
    );

    return respond(res, StatusCodes.OK);
});

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
