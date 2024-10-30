import { EduUser } from "@kontestis/models";
import { Request } from "express";
import { StatusCodes } from "http-status-codes";

import { SafeError } from "../errors/SafeError";
import { extractOptionalEduUser } from "./extractOptionalEduUser";
import { memoizedRequestExtractor } from "./MemoizedRequestExtractor";

export const extractEduUser = async (req: Request): Promise<EduUser> => {
    return memoizedRequestExtractor(req, "__edu_user", async () => {
        const eduUser = await extractOptionalEduUser(req);

        if (!eduUser) throw new SafeError(StatusCodes.NOT_FOUND);

        return eduUser;
    });
};
