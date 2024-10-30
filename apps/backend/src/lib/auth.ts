import { Snowflake, User } from "@kontestis/models";
import { Static, Type } from "@sinclair/typebox";
import { TypeCompiler } from "@sinclair/typebox/compiler";
import jsonwebtoken, { JwtPayload } from "jsonwebtoken";
import md5 from "md5";

import { Database } from "../database/Database";
import { Globals } from "../globals";
import { generateSnowflake } from "./snowflake";

const TOKEN_DURATION = "7d";

const AuthSourceType = Type.Union([
    Type.Literal("google"),
    Type.Literal("aai-edu"),
    Type.Literal("native"),
]);

export type AuthSource = Static<typeof AuthSourceType>;

export const generateJwt = (user_id: Snowflake, source: AuthSource, jti = generateSnowflake()) => {
    return jsonwebtoken.sign(
        {
            user_id: user_id.toString(),
            source,
            jti: jti.toString(),
        },
        Globals.jwtSecret,
        {
            expiresIn: TOKEN_DURATION,
        }
    );
};

const ValidJWTSchema = Type.Object({
    user_id: Type.String(),
    source: AuthSourceType,
    jti: Type.String(),
});

const compiledValidJWTSchema = TypeCompiler.Compile(ValidJWTSchema);

export const validateJwt = async (token: string): Promise<User | null> => {
    let jwt: string | JwtPayload;

    try {
        jwt = jsonwebtoken.verify(token, Globals.jwtSecret);
    } catch {
        return null;
    }

    if (!compiledValidJWTSchema.Check(jwt)) return null;

    // TODO: edu account support
    const user = await Database.selectOneFrom("users", "*", {
        id: jwt.user_id,
    });

    if (!user || !/^\d+$/.test(jwt.jti)) return null;

    return user;
};

export const generateGravatarUrl = (email: string) => {
    return `https://www.gravatar.com/avatar/${md5(email.trim().toLowerCase())}?s=256`;
};
