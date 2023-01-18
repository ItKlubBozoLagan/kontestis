import { Type } from "@sinclair/typebox";
import { compare, hash } from "bcrypt";
import { Request, Router } from "express";
import { sign } from "jsonwebtoken";

import { Database } from "../database/Database";
import { Globals } from "../globals";
import { generateSnowflake } from "../lib/snowflake";
import { AuthenticatedRequest, useAuth } from "../middlewares/useAuth";
import { useValidation } from "../middlewares/useValidation";

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

        if (user) return res.status(400);

        const hashPassword = await hash(req.body.password, 10);

        const newUser = {
            id: generateSnowflake(),
            email: req.body.email,
            username: req.body.username,
            password: hashPassword,
            permissions: 0,
        };

        await Database.insertInto("users", newUser);

        return res.status(200).json(newUser);
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

        if (!user) return res.status(400);

        const validPassword = await compare(req.body.password, user.password);

        if (!validPassword) return res.status(400);

        const token = sign({ _id: user.id }, Globals.tokenSecret);

        res.status(200).send(token);
    }
);

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

AuthHandler.get("/info", useAuth, async (req: AuthenticatedRequest, res) => {
    return res.status(200).json(req.user);
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

AuthHandler.get(
    "/info/:id",
    useAuth,
    async (req: AuthenticatedRequest, res) => {
        if (!req.user) return res.status(403);

        const { user } = req;

        if (!(user.permissions & 1)) return res.status(403);

        const searchUser = await Database.selectOneFrom("users", "*", {
            id: req.params.id,
        });

        if (!searchUser) return res.status(404);

        return res.status(200).json(searchUser);
    }
);

export default AuthHandler;
