// Kontestis as an OAuth 2.0 authorization server for trusted external applications
// (authorization code flow only).
//
// Which applications exist is deployment configuration (OAUTH_PROVIDER_CLIENTS); nothing in
// the source names them. Access tokens issued here are signed with a key that is separate
// from the main session key, so they are rejected by every regular API route and only
// unlock /api/oauth/userinfo.

import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

import { Snowflake } from "@kontestis/models";
import { Static, Type } from "@sinclair/typebox";
import { TypeCompiler } from "@sinclair/typebox/compiler";
import jsonwebtoken from "jsonwebtoken";

import { Globals } from "../globals";
import { Redis } from "../redis/Redis";
import { RedisKeys } from "../redis/RedisKeys";
import { generateSnowflake } from "./snowflake";

const AUTHORIZATION_CODE_TTL_SECONDS = 60;
const ACCESS_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;

const ClientSchema = Type.Object({
    id: Type.String({ minLength: 1 }),
    // shown to the user on the authorization page
    name: Type.String({ minLength: 1 }),
    // hex-encoded SHA-256 of the client secret; secrets must be long random strings
    secret_sha256: Type.String({ pattern: "^[0-9a-fA-F]{64}$" }),
    // compared exactly, no prefix or wildcard matching
    redirect_uris: Type.Array(Type.String({ minLength: 1 }), { minItems: 1 }),
});

export type OAuthClient = Static<typeof ClientSchema>;

const compiledClientsSchema = TypeCompiler.Compile(Type.Array(ClientSchema));

const parseClients = (raw: string): Map<string, OAuthClient> => {
    let parsed: unknown;

    try {
        parsed = JSON.parse(raw);
    } catch {
        throw new Error("OAUTH_PROVIDER_CLIENTS is not valid JSON");
    }

    if (!compiledClientsSchema.Check(parsed))
        throw new Error("OAUTH_PROVIDER_CLIENTS does not match the expected shape");

    const clients = new Map<string, OAuthClient>();

    for (const client of parsed) {
        if (clients.has(client.id))
            throw new Error(`OAUTH_PROVIDER_CLIENTS: duplicate client id ${client.id}`);

        for (const uri of client.redirect_uris) {
            const url = new URL(uri);

            if (url.hash) throw new Error(`OAUTH_PROVIDER_CLIENTS: ${uri} has a fragment`);

            if (url.protocol !== "https:" && url.hostname !== "localhost")
                throw new Error(`OAUTH_PROVIDER_CLIENTS: ${uri} must use https`);
        }

        clients.set(client.id, { ...client, secret_sha256: client.secret_sha256.toLowerCase() });
    }

    return clients;
};

const clients = parseClients(Globals.oauthProviderClients);

const signingKey = createHmac("sha256", Globals.jwtSecret)
    .update("kontestis oauth provider access tokens v1")
    .digest();

const sha256 = (value: string) => createHash("sha256").update(value).digest();

export const findClient = (clientId: string, redirectUri: string): OAuthClient | null => {
    const client = clients.get(clientId);

    if (!client || !client.redirect_uris.includes(redirectUri)) return null;

    return client;
};

export const authenticateClient = (clientId: string, secret: string): OAuthClient | null => {
    const client = clients.get(clientId);

    if (!client) return null;

    const expected = Buffer.from(client.secret_sha256, "hex");

    return timingSafeEqual(sha256(secret), expected) ? client : null;
};

type AuthorizationCodeData = {
    client_id: string;
    redirect_uri: string;
    user_id: string;
};

export const createAuthorizationCode = async (
    client: OAuthClient,
    redirectUri: string,
    userId: Snowflake
) => {
    const code = randomBytes(32).toString("base64url");
    const data: AuthorizationCodeData = {
        client_id: client.id,
        redirect_uri: redirectUri,
        user_id: userId.toString(),
    };

    await Redis.set(
        RedisKeys.OAUTH_AUTHORIZATION_CODE(sha256(code).toString("hex")),
        JSON.stringify(data),
        { EX: AUTHORIZATION_CODE_TTL_SECONDS }
    );

    return code;
};

/** Single use: the code is gone after this call whether or not it was valid. */
export const consumeAuthorizationCode = async (
    code: string
): Promise<AuthorizationCodeData | null> => {
    const raw = await Redis.getDel(
        RedisKeys.OAUTH_AUTHORIZATION_CODE(sha256(code).toString("hex"))
    );

    return raw ? (JSON.parse(raw) as AuthorizationCodeData) : null;
};

export const issueAccessToken = (client: OAuthClient, userId: string) => {
    const token = jsonwebtoken.sign({ jti: generateSnowflake().toString() }, signingKey, {
        algorithm: "HS256",
        subject: userId,
        audience: client.id,
        expiresIn: ACCESS_TOKEN_TTL_SECONDS,
    });

    return { token, expiresIn: ACCESS_TOKEN_TTL_SECONDS };
};

/**
 * Tokens of clients that have been removed from the configuration stop working immediately.
 */
export const verifyAccessToken = (token: string): { userId: bigint; clientId: string } | null => {
    let payload: jsonwebtoken.JwtPayload | string;

    try {
        payload = jsonwebtoken.verify(token, signingKey, { algorithms: ["HS256"] });
    } catch {
        return null;
    }

    if (typeof payload === "string") return null;

    const { sub, aud } = payload;

    if (typeof sub !== "string" || !/^\d+$/.test(sub)) return null;

    if (typeof aud !== "string" || !clients.has(aud)) return null;

    return { userId: BigInt(sub), clientId: aud };
};
