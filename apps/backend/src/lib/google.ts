import { DEFAULT_ELO, FullUser, KnownUserData, User } from "@kontestis/models";
import { AdminPermissions } from "@kontestis/models";
import axios from "axios";
import { EMPTY_PERMISSIONS, grantPermission } from "permissio";
import * as R from "remeda";

import { Database } from "../database/Database";
import { Globals } from "../globals";
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

    if (!Globals.oauthAllowedDomains.some((it) => niceGoogleResponse.email.endsWith("@" + it)))
        throw new Error("domain not supported");

    return niceGoogleResponse;
};

// a bit hacky way of processing pre-inserted user entries
export const fixExistingKnownUser = async (
    knownUserData: KnownUserData,
    tokenData: NiceTokenResponse
): Promise<User | undefined> => {
    const potentialEntry = await Database.selectOneFrom("users", "*", {
        id: knownUserData.user_id,
    });

    if (!potentialEntry) return;

    await Database.deleteFrom("users", "*", { id: potentialEntry.id });

    const updatedUser: User = {
        ...potentialEntry,
        google_id: tokenData.id,
    };

    await Database.insertInto("users", updatedUser);

    return updatedUser;
};

export const processUserFromTokenData = async (tokenData: NiceTokenResponse): Promise<FullUser> => {
    const { id: googleId } = tokenData;

    const [numberUsers, potentialEntry] = await Promise.all([
        Database.raw("SELECT COUNT(id) as userCount FROM users;").then(
            (it) => it.rows[0]["usercount"] as bigint
        ),
        Database.selectOneFrom("users", "*", {
            google_id: googleId,
        }),
    ]);

    let existingUser: User | undefined = potentialEntry;

    if (!potentialEntry) {
        const potentialKnownUser = await Database.selectOneFrom(
            "known_users",
            "*",
            { email: tokenData.email },
            "ALLOW FILTERING"
        );

        if (potentialKnownUser)
            existingUser = await fixExistingKnownUser(potentialKnownUser, tokenData);
    }

    const user: User = existingUser ?? {
        id: generateSnowflake(),
        elo: DEFAULT_ELO,
        google_id: googleId,
        permissions:
            numberUsers === 0n
                ? grantPermission(EMPTY_PERMISSIONS, AdminPermissions.ADMIN)
                : grantPermission(EMPTY_PERMISSIONS, AdminPermissions.ADD_CONTEST),
    };

    if (!existingUser) await Database.insertInto("users", user);

    return {
        ...user,
        picture_url: tokenData.picture_url,
        email: tokenData.email,
        full_name: tokenData.name,
    };
};
