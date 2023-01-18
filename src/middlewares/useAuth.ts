import { Type } from "@sinclair/typebox";
import { TypeCompiler } from "@sinclair/typebox/compiler";
import { NextFunction, Request, Response } from "express";
import { JwtPayload, verify } from "jsonwebtoken";

import { Database } from "../database/Database";
import { Globals } from "../globals";
import { User } from "../types/User";

const jwtSchema = Type.Object({
    _id: Type.String()
});

const compiledSchema = TypeCompiler.Compile(jwtSchema);

export type AuthenticatedRequest = Request & {
    user?: User;
}

const validateJwt = async (token?: string): Promise<User | null> => {
    let jwt: string | JwtPayload;
    try {
        jwt = verify(token ?? "", Globals.tokenSecret);
    } catch {
        return null;
    }

    if(!compiledSchema.Check(jwt)) {
        return null;
    }

    const user = await Database.selectOneFrom("users", "*", {id: jwt._id});

    return user ?? null;
};

const getAuth = (optional: boolean) => {
    return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {

        const auth = req.header("authorization");

        if(!(auth && auth.startsWith("Bearer "))) {
            return optional ? next() : res.status(403).send("Access denied");
        }

        const token = auth.slice("Bearer ".length);
        const validated = await validateJwt(token);
        if(!validated) {
            return optional ? next() : res.status(403).send("Access denied");
        }

        req.user = validated;
        next();
    }
}


export const useAuth = getAuth(false);
export const useOptionalAuth = getAuth(true);
