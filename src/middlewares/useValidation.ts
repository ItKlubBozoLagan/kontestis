import { Static, TSchema } from "@sinclair/typebox";
import { TypeCompiler } from "@sinclair/typebox/compiler";
import { Request } from "express";
import { Query, RequestHandler } from "express-serve-static-core";
import { StatusCodes } from "http-status-codes";

import { respond } from "../utils/response";

type SchemaOptions = {
    body?: boolean;
    query?: boolean;
};

export type ValidatedBody<S extends TSchema> = Request<
    any,
    any,
    Static<S>,
    any
>;

type SchemaRequestHandler<S extends SchemaOptions, O> = RequestHandler<
    any,
    any,
    S extends { body: true } ? O : any,
    S extends { query: true } ? O : Query
>;

export const useValidation = <
    TS extends TSchema,
    S extends SchemaOptions = { body: true }
>(
    schema: TS,
    options_?: S & SchemaOptions
): SchemaRequestHandler<S, Static<TS>> => {
    const options: SchemaOptions = options_ ?? { body: true };
    const check = TypeCompiler.Compile(schema);

    return (req, res, next) => {
        if (
            Object.entries(options)
                .filter(([, v]) => v)
                .some(([key]) => !check.Check(req[key as keyof SchemaOptions]))
        )
            return respond(res, StatusCodes.BAD_REQUEST);

        next();
    };
};
