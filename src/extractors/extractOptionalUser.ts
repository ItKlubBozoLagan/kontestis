import { Request } from "express";

import { SafeError } from "../errors/SafeError";
import { extractUser } from "./extractUser";

export const extractOptionalUser = async (req: Request) => {
    try {
        return await extractUser(req);
    } catch (error: any) {
        if (error instanceof SafeError) return null;

        throw error;
    }
};
