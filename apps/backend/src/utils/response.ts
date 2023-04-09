import { Response } from "express";
import { getReasonPhrase, StatusCodes } from "http-status-codes";
import superjson from "superjson";

import { Globals } from "../globals";
import { Influx } from "../influx/Influx";

const insertInfluxActivity = (statusCode: StatusCodes) => {
    Influx.insertSync("activity", { statusCode: statusCode.toString() }, { happened: true });
};

export const respond = (
    response: Response,
    status: StatusCodes,
    data?: Record<string, unknown> | unknown[]
) => {
    insertInfluxActivity(status);

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

export const reject = (
    response: Response,
    status: StatusCodes,
    error: string | string[] = getReasonPhrase(status)
) => {
    insertInfluxActivity(status);

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
