import { ManagedUser, User } from "@kontestis/models";
import { Type } from "@sinclair/typebox";
import { hash, verify } from "argon2";
import { Router } from "express";
import { StatusCodes } from "http-status-codes";
import { EMPTY_PERMISSIONS } from "permissio";

import { Database } from "../../database/Database";
import { SafeError } from "../../errors/SafeError";
import { generateGravatarUrl, generateJwt, processLogin } from "../../lib/auth";
import { generateSnowflake } from "../../lib/snowflake";
import { useValidation } from "../../middlewares/useValidation";
import { respond } from "../../utils/response";

const ManagedHandler = Router();

const LoginSchema = Type.Object({
    email: Type.String(),
    password: Type.String({ minLength: 4, maxLength: 1 << 10 }),
});

ManagedHandler.post("/login", useValidation(LoginSchema, { body: true }), async (req, res) => {
    const managedUser = await Database.selectOneFrom("managed_users", "*", {
        email: req.body.email,
    });

    if (!managedUser) throw new SafeError(StatusCodes.NOT_FOUND);

    const verifyResult = await verify(managedUser.password, req.body.password);

    if (!verifyResult) throw new SafeError(StatusCodes.NOT_FOUND);

    if (!managedUser.confirmed_at) throw new SafeError(StatusCodes.UNPROCESSABLE_ENTITY);

    const user = await Database.selectOneFrom("users", ["id"], {
        id: managedUser.id,
    });

    if (!user) throw new SafeError(StatusCodes.INTERNAL_SERVER_ERROR);

    return respond(res, StatusCodes.OK, { token: generateJwt(user.id, "managed", {}) });
});

const RegisterSchema = Type.Object({
    email: Type.RegEx(/^[^@]+@[^@]+\.[^@]+$/),
    password: Type.String({ minLength: 4, maxLength: 1 << 10 }),
    full_name: Type.String({ minLength: 4, maxLength: 128 }),
    picture_url: Type.Optional(Type.String({ maxLength: 1024 })),
});

ManagedHandler.post(
    "/register",
    useValidation(RegisterSchema, { body: true }),
    async (req, res) => {
        const existingUser = await Database.selectOneFrom("users", ["id"], {
            email: req.body.email,
        });

        if (existingUser) throw new SafeError(StatusCodes.CONFLICT);

        const passwordHash = await hash(req.body.password);

        const managedUser: ManagedUser = {
            id: generateSnowflake(),
            email: req.body.email,
            password: passwordHash,
            created_at: new Date(),
            confirmed_at: undefined,
        };

        const user: User = {
            id: managedUser.id,
            email: managedUser.email,
            permissions: EMPTY_PERMISSIONS,
            full_name: req.body.full_name,
            picture_url: req.body.picture_url ?? generateGravatarUrl(managedUser.email),
        };

        await Database.insertInto("managed_users", managedUser);
        await Database.insertInto("users", user);

        await processLogin(user, true);

        return respond(res, StatusCodes.OK, user);
    }
);

export default ManagedHandler;
