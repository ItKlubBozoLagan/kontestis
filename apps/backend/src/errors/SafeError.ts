import { getReasonPhrase, StatusCodes } from "http-status-codes";

export class SafeError extends Error {
    constructor(public code: StatusCodes, message = getReasonPhrase(code)) {
        super(message);
    }
}
