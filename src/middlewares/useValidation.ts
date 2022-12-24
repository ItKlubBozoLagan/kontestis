import { Static, TSchema } from "@sinclair/typebox";
import { TypeCompiler } from "@sinclair/typebox/compiler";
import { Query, RequestHandler } from "express-serve-static-core";
import {Request} from "express";

type SchemaOpts = {
    body?: boolean,
    query?: boolean
};

export type ValidatedBody<S extends TSchema> = Request<any, any, Static<S>, any>;

type SchemaRequestHandler<S extends SchemaOpts, O> =
    RequestHandler<
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        S extends { body: true } ? O : any,
        S extends { query: true } ? O : Query
    >

export const useValidation = <TS extends TSchema, S extends SchemaOpts = { body: true }>(schema: TS, opts?: S & SchemaOpts): SchemaRequestHandler<S, Static<TS>> => {
    const options: SchemaOpts = opts ?? { body: true };
    const check = TypeCompiler.Compile(schema);

    return (req, res, next) => {
        if(
            Object.entries(options)
                .filter(([,v]) => v)
                .some(([ key ]) => !check.Check(req[key as keyof SchemaOpts]))
        )
            return res.status(400).send("Bad request");
        
        next();
    };
};