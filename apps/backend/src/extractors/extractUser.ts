import { FullUser } from "@kontestis/models";
import { Request } from "express";
import { StatusCodes } from "http-status-codes";

import { SafeError } from "../errors/SafeError";
import { processUserFromTokenData, verifyToken } from "../lib/google";
import { memoizedRequestExtractor } from "./MemoizedRequestExtractor";

export const extractUser = async (req: Request): Promise<FullUser> => {
    return memoizedRequestExtractor(req, "__user", async () => {
        const auth = req.header("authorization");

        if (!(auth && auth.startsWith("Bearer ")))
            throw new SafeError(StatusCodes.UNAUTHORIZED);

        const token = auth.slice("Bearer ".length);
        const tokenData = await verifyToken(token).catch(() => null);

        if (tokenData === null) throw new SafeError(StatusCodes.UNAUTHORIZED);

        return processUserFromTokenData(tokenData);
    });
};
