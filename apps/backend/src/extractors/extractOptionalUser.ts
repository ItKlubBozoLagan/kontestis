import { Request } from "express";
import { StatusCodes } from "http-status-codes";

import { SafeError } from "../errors/SafeError";
import { extractUser } from "./extractUser";

export const extractOptionalUser = async (req: Request) => {
    try {
        return await extractUser(req);
    } catch (error: any) {
        if (error instanceof SafeError && error.code === StatusCodes.FORBIDDEN) return null;

        throw error;
    }
};
