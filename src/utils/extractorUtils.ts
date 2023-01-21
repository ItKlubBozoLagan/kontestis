import { Request } from "express";
import { StatusCodes } from "http-status-codes";

import { SafeError } from "../errors/SafeError";

export const extractIdFromParams = (req: Request, key: string) => {
    if (!req.params[key])
        throw new SafeError(StatusCodes.INTERNAL_SERVER_ERROR);

    return BigInt(req.params[key]);
};
