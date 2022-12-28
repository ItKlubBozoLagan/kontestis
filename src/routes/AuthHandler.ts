import { Type } from "@sinclair/typebox";
import { compare, hash } from "bcrypt";
import {Request, Router} from "express";
import { sign } from "jsonwebtoken";

import { DataBase } from "../data/Database";
import { Globals } from "../globals";
import { generateSnowflake } from "../lib/snowflake";
import { AuthenticatedRequest, useAuth } from "../middlewares/useAuth";
import { useValidation } from "../middlewares/useValidation";
import { User } from "../types/User";

const AuthHandler = Router();

const registerSchema = Type.Object({
    email: Type.String(),
    username: Type.String(),
    password: Type.String()
});

const loginSchema = Type.Object({
    email: Type.String(),
    password: Type.String()
});

AuthHandler.post("/register", useValidation(registerSchema, {body: true}), async (req: Request, res) => {
    const user = await DataBase.selectOneFrom("users", "*", {email: req.body.email});

    if(user) return res.status(400).send("User already exists!");

    const hashPassword = await hash(req.body.password, 10);

    const newUser: User = { id: generateSnowflake(), email: req.body.email, username: req.body.username, password: hashPassword,  permissions: 0};

    await DataBase.insertInto("users", newUser);
    
    return res.status(200).send(newUser);
});

AuthHandler.post("/login", useValidation(loginSchema, { body: true }), async (req, res) => {

    const user = await DataBase.selectOneFrom("users", "*", { email: req.body.email });

    if(!user) return res.status(400).send("Invalid username or password!");
    
    const validPassword = await compare(req.body.password, user.password);
    
    if(!validPassword) return res.status(400).send("Invalid username or password!");

    const token = sign({_id: user.id}, Globals.tokenSecret);

    res.status(200).send(token);
});

AuthHandler.get("/info", useAuth, async (req: AuthenticatedRequest, res) => {
    return res.status(200).json(req.user);
});

AuthHandler.get("/info/:id", useAuth, async (req: AuthenticatedRequest, res) => {

    if(!req.user) return res.status(403).send("Access denied!");

    const user = req.user;
    if(!(user.permissions & 1)) return res.status(403).send("Access denied!");

    const searchUser = await DataBase.selectOneFrom("users", "*", { id: req.params.id });

    if(!searchUser) return res.status(404).send("User not found!");

    return res.status(200).json(searchUser);

});

export default AuthHandler;