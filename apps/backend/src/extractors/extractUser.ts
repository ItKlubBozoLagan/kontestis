import { FullUser } from "@kontestis/models";
import { Request } from "express";
import { StatusCodes } from "http-status-codes";

import { Database } from "../database/Database";
import { SafeError } from "../errors/SafeError";
import { validateJwt } from "../lib/auth";
import { memoizedRequestExtractor } from "./MemoizedRequestExtractor";

export const extractUser = async (req: Request): Promise<FullUser> => {
    return memoizedRequestExtractor(req, "__user", async () => {
        const auth = req.header("authorization");

        if (!(auth && auth.startsWith("Bearer "))) throw new SafeError(StatusCodes.UNAUTHORIZED);

        const token = auth.slice("Bearer ".length);
        const jwtData = await validateJwt(token).catch(() => null);

        if (jwtData === null) throw new SafeError(StatusCodes.UNAUTHORIZED);

        const { user: tokenData, authSource } = jwtData;

        const eduUser = await Database.selectOneFrom("edu_users", "*", {
            id: tokenData.id,
        });

        if (eduUser)
            return {
                ...tokenData,
                auth_source: authSource,
                is_edu: true,
                edu_data: eduUser,
            };

        return {
            ...tokenData,
            is_edu: false,
            auth_source: authSource,
        };
    });
};
