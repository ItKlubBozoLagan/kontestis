import { ManagedUser, User } from "@kontestis/models";
import { Type } from "@sinclair/typebox";
import { hash, verify } from "argon2";
import { Router } from "express";
import { StatusCodes } from "http-status-codes";
import { EMPTY_PERMISSIONS } from "permissio";

import { Database } from "../../database/Database";
import { SafeError } from "../../errors/SafeError";
import { Globals } from "../../globals";
import { generateGravatarUrl, generateJwt, processLogin } from "../../lib/auth";
import { sendRegistrationMail } from "../../lib/mail";
import { generateSnowflake } from "../../lib/snowflake";
import { useCaptcha, useCaptchaSchema } from "../../middlewares/useCaptcha";
import { useValidation } from "../../middlewares/useValidation";
import { Redis } from "../../redis/Redis";
import { RedisKeys } from "../../redis/RedisKeys";
import { randomSequence } from "../../utils/random";
import { respond } from "../../utils/response";

const ManagedHandler = Router();

const processEmailVerification = async (user: User) => {
    const code = randomSequence(32);

    await Redis.set(RedisKeys.MANAGED_USER_CONFIRMATION_CODE(user.id), code, {
        EX: 30 * 60,
    });

    const _ = sendRegistrationMail(user, code);
};

const LoginSchema = Type.Object({
    email: Type.String(),
    password: Type.String({ minLength: 4, maxLength: 1 << 10 }),
});

ManagedHandler.post("/login", useValidation(LoginSchema, { body: true }), async (req, res) => {
    const managedUser = await Database.selectOneFrom("managed_users", "*", {
        email: req.body.email,
    });

    if (!managedUser) throw new SafeError(StatusCodes.UNAUTHORIZED);

    const verifyResult = await verify(managedUser.password, req.body.password);

    if (!verifyResult) throw new SafeError(StatusCodes.UNAUTHORIZED);

    const user = await Database.selectOneFrom("users", "*", {
        id: managedUser.id,
    });

    if (!user) throw new SafeError(StatusCodes.INTERNAL_SERVER_ERROR);

    if (!managedUser.confirmed_at) {
        const confirmationCode = await Redis.get(
            RedisKeys.MANAGED_USER_CONFIRMATION_CODE(managedUser.id)
        );

        if (confirmationCode !== null) {
            throw new SafeError(StatusCodes.UNPROCESSABLE_ENTITY);
        }

        await processEmailVerification(user);

        throw new SafeError(StatusCodes.UNPROCESSABLE_ENTITY, "verification-repeat");
    }

    await processLogin(user, {
        newLogin: false,
        confirm: true,
    });

    return respond(res, StatusCodes.OK, { token: generateJwt(user.id, "managed", {}) });
});

const RegisterSchema = Type.Object({
    email: Type.RegEx(/^[^@]+@[^@]+\.[^@]+$/),
    password: Type.String({ minLength: 4, maxLength: 1024 }),
    full_name: Type.String({ minLength: 4, maxLength: 128 }),
    picture_url: Type.Optional(Type.String({ maxLength: 1024 })),
});

ManagedHandler.post(
    "/register",
    useCaptchaSchema,
    useCaptcha,
    useValidation(RegisterSchema, { body: true }),
    async (req, res) => {
        const existingUser = await Database.selectOneFrom("users", ["id"], {
            email: req.body.email.toLowerCase(),
        });

        if (existingUser) throw new SafeError(StatusCodes.CONFLICT);

        const passwordHash = await hash(req.body.password);

        const managedUser: ManagedUser = {
            id: generateSnowflake(),
            email: req.body.email.toLowerCase(),
            password: passwordHash,
            created_at: new Date(),
            confirmed_at: undefined,
        };

        const user: User = {
            id: managedUser.id,
            email: managedUser.email.toLowerCase(),
            permissions: EMPTY_PERMISSIONS,
            full_name: req.body.full_name,
            picture_url:
                req.body.picture_url ?? generateGravatarUrl(managedUser.email.toLowerCase()),
        };

        await Database.insertInto("managed_users", managedUser);
        await Database.insertInto("users", user);

        await Promise.all([
            processLogin(user, {
                newLogin: false,
                confirm: false,
            }),
            processEmailVerification(user),
        ]);

        return respond(res, StatusCodes.ACCEPTED, user);
    }
);

ManagedHandler.get("/confirm/:user_id/:code", async (req, res) => {
    const user = await Database.selectOneFrom("managed_users", ["id", "confirmed_at"], {
        id: req.params.user_id,
    });

    if (!user) throw new SafeError(StatusCodes.NOT_FOUND);

    if (user.confirmed_at) throw new SafeError(StatusCodes.CONFLICT);

    const confirmationCode = await Redis.get(RedisKeys.MANAGED_USER_CONFIRMATION_CODE(user.id));

    if (confirmationCode !== req.params.code) throw new SafeError(StatusCodes.NOT_FOUND);

    await Database.update(
        "managed_users",
        {
            confirmed_at: new Date(),
        },
        {
            id: user.id,
        }
    );

    await Redis.del(RedisKeys.MANAGED_USER_CONFIRMATION_CODE(user.id));

    return res.redirect(`${Globals.frontendUrl}/?confirmed=true`);
});

export default ManagedHandler;
