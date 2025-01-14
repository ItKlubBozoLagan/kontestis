import qs from "node:querystring";

import { Static, Type } from "@sinclair/typebox";
import axios from "axios";
import { RequestHandler } from "express";
import { ParamsDictionary } from "express-serve-static-core";
import { StatusCodes } from "http-status-codes";

import { SafeError } from "../errors/SafeError";
import { Globals } from "../globals";
import { ipFromRequest } from "../utils/request";
import { useValidation } from "./useValidation";

const CAPTCHA_VERIFY_URL = "https://www.google.com/recaptcha/api/siteverify";
const CAPTCHA_THRESHOLD = 0.5;

const CaptchaSchema = Type.Object({
    captcha_token: Type.String(),
});

export const useCaptchaSchema = useValidation(CaptchaSchema, { query: true });

type CaptchaResponse = {
    success: true;
    score: number;
};

const submitCaptcha = (token: string, address: string): Promise<CaptchaResponse> =>
    axios
        .post<CaptchaResponse>(
            CAPTCHA_VERIFY_URL,
            qs.stringify({
                secret: Globals.captcha.secret,
                response: token,
                remoteip: address,
            }),
            {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
            }
        )
        .then((data) => data.data);

export const useCaptcha: RequestHandler<
    ParamsDictionary,
    any,
    any,
    Static<typeof CaptchaSchema>
> = async (req, res, next) => {
    if (!Globals.captcha.enabled) return next();

    const captchaToken = req.query.captcha_token;
    const address = ipFromRequest(req);

    const { success, score } = await submitCaptcha(captchaToken, address);

    if (!success || score < CAPTCHA_THRESHOLD)
        throw new SafeError(StatusCodes.FORBIDDEN, "Captcha failed!");

    next();
};
