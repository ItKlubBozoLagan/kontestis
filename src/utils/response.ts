import { Response } from "express";
import { StatusCodes } from "http-status-codes";

export const respond = (
    response: Response,
    status: StatusCodes,
    data?: object
) => {
    response.status(status).json({
        status,
        data,
    });
};
