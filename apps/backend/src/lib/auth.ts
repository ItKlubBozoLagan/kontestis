import {
    AuthSource,
    DEFAULT_ELO,
    OrganisationPermissions,
    Snowflake,
    User,
} from "@kontestis/models";
import { Type } from "@sinclair/typebox";
import { TypeCompiler } from "@sinclair/typebox/compiler";
import jsonwebtoken, { JwtPayload } from "jsonwebtoken";
import md5 from "md5";
import { EMPTY_PERMISSIONS, grantPermission } from "permissio";

import { Database } from "../database/Database";
import { DEFAULT_ORGANISATION } from "../extractors/extractOrganisation";
import { Globals } from "../globals";
import { Influx } from "../influx/Influx";
import { randomSequence } from "../utils/random";
import { generateSnowflake } from "./snowflake";

const TOKEN_DURATION = "7d";

const AuthSourceType = Type.Union([
    Type.Literal("google"),
    Type.Literal("aai-edu"),
    Type.Literal("managed"),
]);

export const generateJwt = <
    S extends AuthSource,
    E extends S extends "aai-edu" ? { id_token: string } : {}
>(
    user_id: Snowflake,
    source: AuthSource,
    extra: E,
    jti = generateSnowflake()
) => {
    return jsonwebtoken.sign(
        {
            user_id: user_id.toString(),
            source,
            ...extra,
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

export const validateJwt = async (
    token: string
): Promise<{
    user: User;
    authSource: AuthSource;
} | null> => {
    let jwt: string | JwtPayload;

    try {
        jwt = jsonwebtoken.verify(token, Globals.jwtSecret);
    } catch {
        return null;
    }

    if (!compiledValidJWTSchema.Check(jwt)) return null;

    const user = await Database.selectOneFrom("users", "*", {
        id: jwt.user_id,
    });

    if (!user || !/^\d+$/.test(jwt.jti)) return null;

    return {
        user,
        authSource: jwt.source,
    };
};

export const generateGravatarUrl = (email: string) => {
    return `https://www.gravatar.com/avatar/${md5(email.trim().toLowerCase())}?s=256`;
};

export const processLogin = async (
    user: User,
    options: {
        newLogin: boolean;
        confirm: boolean;
    }
) => {
    const defaultOrgMember = await Database.selectOneFrom("organisation_members", ["id"], {
        organisation_id: DEFAULT_ORGANISATION.id,
        user_id: user.id,
    });

    if (!defaultOrgMember)
        await Database.insertInto("organisation_members", {
            id: generateSnowflake(),
            organisation_id: DEFAULT_ORGANISATION.id,
            user_id: user.id,
            elo: DEFAULT_ELO,
            permissions: grantPermission(
                EMPTY_PERMISSIONS,
                OrganisationPermissions.VIEW | OrganisationPermissions.ADD_CONTEST
            ),
        });

    const mailPreferences = await Database.selectOneFrom("mail_preferences", ["status"], {
        user_id: user.id,
    });

    if (!mailPreferences)
        await Database.insertInto("mail_preferences", {
            user_id: user.id,
            status: "all",
            code: randomSequence(16),
        });

    if (options.confirm) {
        const managed = await Database.selectOneFrom("managed_users", ["confirmed_at"], {
            id: user.id,
        });

        if (managed && !managed.confirmed_at)
            await Database.update("managed_users", { confirmed_at: new Date() }, { id: user.id });
    }

    await Influx.insert(
        "logins",
        { userId: user.id.toString(), newLogin: String(options.newLogin) },
        { happened: true }
    );
};
