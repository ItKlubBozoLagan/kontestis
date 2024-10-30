import { EduUser } from "@kontestis/models";
import { Request } from "express";

import { Database } from "../database/Database";
import { extractUser } from "./extractUser";
import { memoizedRequestExtractor } from "./MemoizedRequestExtractor";

export const extractOptionalEduUser = async (req: Request): Promise<EduUser | undefined> => {
    return memoizedRequestExtractor(req, "__edu_user", async () => {
        const user = await extractUser(req);

        const eduUser = await Database.selectOneFrom("edu_users", "*", {
            id: user.id,
        });

        if (!eduUser) return;

        return eduUser;
    });
};
