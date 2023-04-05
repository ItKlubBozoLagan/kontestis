import { Request } from "express";

type StringHeader = string | undefined;

export const ipFromRequest = (req: Request) => {
    return (
        (req.headers["cf-connecting-ip"] as StringHeader) ??
        (req.headers["x-forwarded-for"] as StringHeader)
            ?.split(",")
            .filter(Boolean)
            .map((it) => it.trim())[0] ??
        req.socket.remoteAddress ??
        req.ip
    );
};
