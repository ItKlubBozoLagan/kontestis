import { Response } from "express";
import { StatusCodes } from "http-status-codes";
import superjson from "superjson";

import { Globals } from "../globals";

export const respond = (
    response: Response,
    status: StatusCodes,
    data?: Record<string, unknown> | unknown[]
) => {
    response.status(status).json({
        status,
        ...(Globals.mode === "development"
            ? {
                  data_raw: data,
              }
            : {}),
        data: superjson.stringify(data),
        errors: [],
    });
};

export const reject = (response: Response, status: StatusCodes, error: string | string[]) => {
    response.status(status).json({
        status,
        ...(Globals.mode === "development"
            ? {
                  data_raw: {},
              }
            : {}),
        data: superjson.stringify({}),
        errors: typeof error === "string" ? [error] : error,
    });
};
