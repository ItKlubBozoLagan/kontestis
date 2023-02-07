import { Type } from "@sinclair/typebox";
import { compare, hash } from "bcrypt";
import { Request, Router } from "express";
import { StatusCodes } from "http-status-codes";
import { sign } from "jsonwebtoken";
import * as R from "remeda";

import { User } from "../../../../packages/models/src/User";
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

/**
 * @apiDefine RequiredAuth
 *
 * @apiHeader Authorization Bearer {jtw}
 *
 * @apiError Unauthorised Invalid token or user has no permissions to access the needed content.
 *
 *
 * @apiErrorExample Error-Response:
 *     403 Access Denied.
 */

/**
 * @apiDefine ExampleUser
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *     "id": "135335143509331968",
 *     "email": "joe@gmail.com",
 *     "password": "$2b$10$IVlJSA6NGL77rIlQynBZmOyUe2NVNznt29AEq7LiEWZWu5OsbFm3u",
 *     "permissions": "0",
 *     "username": "Joe"
 *      }
 */

const registerSchema = Type.Object({
    email: Type.String({ minLength: 5, maxLength: 50 }),
    username: Type.String({ minLength: 5, maxLength: 50 }),
    password: Type.String({ minLength: 5, maxLength: 50 }),
});

const loginSchema = Type.Object({
    email: Type.String(),
    password: Type.String(),
});

/**
 * @api {post} /api/auth/register RegisterUser
 * @apiName RegisterUser
 * @apiGroup User
 *
 *
 * @apiBody {String} email User email.
 * @apiBody {String} username User name.
 * @apiBody {String} password User password.
 *
 * @apiSuccess {Object} Created user.
 *
 * @apiUse ExampleUser
 *
 * @apiError UserAlreadyExists The user with that nain already exists.
 *
 * @apiErrorExample Error-Response:
 *     400 Bad request
 */

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

/**
 * @api {post} /api/auth/login LoginUser
 * @apiName LoginUser
 * @apiGroup User
 *
 *
 * @apiBody {String} email User email.
 * @apiBody {String} password User password.
 *
 * @apiSuccess {String} jwt Generated Auth Token.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     token
 *
 * @apiError InvalidUserOrPassword The user with that name does not exist or the password is not correct.
 *
 * @apiErrorExample Error-Response:
 *     400 Bad request
 */

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

/**
 * @api {get} /api/auth/info UserInfo
 * @apiName InfoUser
 * @apiGroup User
 *
 * @apiUse RequiredAuth
 *
 * @apiSuccess {Object} user Current user info.
 *
 * @apiUse ExampleUser
 *
 */

AuthHandler.get("/info", async (req, res) => {
    const user = await extractUser(req);

    return respond(res, StatusCodes.OK, R.omit(user, ["password"]));
});

/**
 * @api {get} /api/auth/info/:id UserInfoOther
 * @apiName InfoUserOther
 * @apiGroup User
 *
 * @apiParam {String} id User to view, requires administration permissions.
 *
 * @apiUse RequiredAuth
 *
 * @apiSuccess {Object} user Selected user info.
 *
 * @apiUse ExampleUser
 *
 */

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
