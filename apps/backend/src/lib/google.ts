import { FullUser, User } from "@kontestis/models";
import axios from "axios";
import { EMPTY_PERMISSIONS, grantPermission } from "permissio";
import * as R from "remeda";

import { Database } from "../database/Database";
import { AdminPermissions } from "../permissions/AdminPermissions";
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

export const verifyToken = async (
    token: string
): Promise<NiceTokenResponse> => {
    const niceGoogleResponse = await axios
        .get<VerifyTokenResponse>("https://oauth2.googleapis.com/tokeninfo", {
            params: { id_token: token },
        })
        .then(({ data }) => ({
            ...R.omit(data, ["sub", "picture"]),
            id: data.sub,
            picture_url: data.picture,
        }));

    if (niceGoogleResponse.email_verified !== "true")
        throw new Error("email not verified");

    if (!niceGoogleResponse.email.endsWith("@skole.hr"))
        throw new Error("domain not supported");

    return niceGoogleResponse;
};

export const processUserFromTokenData = async (
    tokenData: NiceTokenResponse
): Promise<FullUser> => {
    const { id: googleId } = tokenData;

    const [numberUsers, potentialEntry] = await Promise.all([
        Database.raw("SELECT COUNT(id) as userCount FROM users;").then(
            (it) => it.rows[0]["usercount"] as bigint
        ),
        Database.selectOneFrom("users", "*", {
            google_id: googleId,
        }),
    ]);

    const user: User = potentialEntry ?? {
        id: generateSnowflake(),
        google_id: BigInt(googleId),
        permissions:
            numberUsers === 0n
                ? grantPermission(EMPTY_PERMISSIONS, AdminPermissions.ADMIN)
                : EMPTY_PERMISSIONS,
    };

    if (!potentialEntry) await Database.insertInto("users", user);

    return {
        ...user,
        picture_url: tokenData.picture_url,
        email: tokenData.email,
        full_name: tokenData.name,
    };
};
