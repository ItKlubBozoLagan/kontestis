import { User } from "@kontestis/models";
import { AdminPermissions } from "@kontestis/models";
import axios from "axios";
import { sign } from "jsonwebtoken";
import { EMPTY_PERMISSIONS, grantPermission } from "permissio";

import { Database } from "../database/Database";
import { Globals } from "../globals";
import { R } from "../utils/remeda";
import { processLogin } from "./auth";
import { generateSnowflake } from "./snowflake";

type VerifyTokenResponse = {
    sub: string;
    hd: string;
    email: string;
    email_verified: string;
    name: string;
    picture: string;
};

type NiceTokenResponse = Omit<VerifyTokenResponse, "sub" | "picture"> & {
    id: string;
    picture_url: string;
};

type GoogleServiceTokenResponse = {
    id_token: string;
};

const GOOGLE_TOKEN_URL = "https://www.googleapis.com/oauth2/v4/token";
const GOOGLE_TOKEN_EXPIRY = "1h";
const GOOGLE_TOKEN_REFRESH_PERIOD = 50 * 60 * 1000; // 50 minutes

type TokenCache = {
    token: string | undefined;
    lastUpdated: number;
};

const googleServiceTokenCache: TokenCache = {
    token: undefined,
    lastUpdated: 0,
};

export const verifyToken = async (token: string): Promise<NiceTokenResponse> => {
    const niceGoogleResponse = await axios
        .get<VerifyTokenResponse>("https://oauth2.googleapis.com/tokeninfo", {
            params: { id_token: token },
        })
        .then(({ data }) => ({
            ...R.omit(data, ["sub", "picture"]),
            id: data.sub,
            picture_url: data.picture,
        }));

    if (niceGoogleResponse.email_verified !== "true") throw new Error("email not verified");

    return niceGoogleResponse;
};

export const processUserFromTokenData = async (tokenData: NiceTokenResponse): Promise<User> => {
    const { email: _email } = tokenData;

    const email = _email.toLowerCase();

    const [numberUsers, potentialEntry] = await Promise.all([
        Database.raw("SELECT COUNT(id) as userCount FROM users;").then(
            (it) => it.rows[0]["usercount"] as bigint
        ),
        Database.selectOneFrom("users", "*", {
            email,
        }),
    ]);

    const user: User = potentialEntry ?? {
        id: generateSnowflake(),
        email,
        full_name: tokenData.name,
        picture_url: tokenData.picture_url,
        permissions:
            numberUsers === 0n
                ? grantPermission(EMPTY_PERMISSIONS, AdminPermissions.ADMIN)
                : EMPTY_PERMISSIONS,
    };

    if (!potentialEntry) {
        await Database.insertInto("users", user);
    }

    await processLogin(user, {
        newLogin: !potentialEntry,
        confirm: true,
    });

    return user;
};

const exchangeEvaluatorServiceToken = async (): Promise<string | undefined> => {
    const privateKey = Globals.evaluatorServiceAccountPrivateKey;

    if (!privateKey) return;

    const selfSigned = sign(
        {
            target_audience: Globals.evaluatorEndpoint,
        },
        privateKey,
        {
            algorithm: "RS256",
            audience: GOOGLE_TOKEN_URL,
            issuer: Globals.evaluatorServiceAccountEmail,
            subject: Globals.evaluatorServiceAccountEmail,
            expiresIn: GOOGLE_TOKEN_EXPIRY,
        }
    );

    return await axios
        .post<GoogleServiceTokenResponse>(
            GOOGLE_TOKEN_URL,
            {
                grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
                assertion: selfSigned,
            },
            {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                    Authorization: `Bearer ${selfSigned}`,
                },
            }
        )
        .then((data) => data.data.id_token);
};

export const getEvaluatorServiceToken = async (): Promise<string | undefined> => {
    const privateKey = Globals.evaluatorServiceAccountPrivateKey;

    if (!privateKey) return;

    if (
        googleServiceTokenCache.token &&
        Date.now() - googleServiceTokenCache.lastUpdated < GOOGLE_TOKEN_REFRESH_PERIOD
    )
        return googleServiceTokenCache.token;

    const token = await exchangeEvaluatorServiceToken();

    googleServiceTokenCache.token = token;
    googleServiceTokenCache.lastUpdated = Date.now();

    return token;
};
