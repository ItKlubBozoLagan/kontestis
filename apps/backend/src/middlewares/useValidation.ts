import { Static, TSchema } from "@sinclair/typebox";
import { TypeCompiler } from "@sinclair/typebox/compiler";
import {
    ParamsDictionary,
    Query,
    RequestHandler,
} from "express-serve-static-core";
import { StatusCodes } from "http-status-codes";

import { SafeError } from "../errors/SafeError";

type SchemaOptions = {
    body?: boolean;
    query?: boolean;
};

type SchemaRequestHandler<S extends SchemaOptions, O> = RequestHandler<
    ParamsDictionary,
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
            throw new SafeError(StatusCodes.BAD_REQUEST);

        next();
    };
};
