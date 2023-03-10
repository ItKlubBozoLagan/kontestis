import { safeParseJson } from "@kontestis/utils";
import axios, { AxiosResponse } from "axios";
import contentType from "content-type";
import {
    UseMutationOptions,
    UseMutationResult,
    UseQueryOptions,
    UseQueryResult,
} from "react-query";
import superjson from "superjson";
import { z } from "zod";

import { useTokenStore } from "../state/token";
import { HttpError } from "./HttpError";

export type ServerData<T> = { data: T };

export type MutationHandler<TVariables, TData, Parameter = never> = [Parameter] extends [never]
    ? (
          options?: UseMutationOptions<TData, HttpError, TVariables>
      ) => UseMutationResult<TData, HttpError, TVariables>
    : (
          parameters: Parameter,
          options?: UseMutationOptions<TData, HttpError, TVariables>
      ) => UseMutationResult<TData, HttpError, TVariables>;

type QueryOptions<TData> = UseQueryOptions<unknown, HttpError, TData, (string | number | bigint)[]>;

export type QueryHandler<TData, Parameter = never> = [Parameter] extends [never]
    ? (options?: QueryOptions<TData>) => UseQueryResult<TData, HttpError>
    : (parameters: Parameter, options?: QueryOptions<TData>) => UseQueryResult<TData, HttpError>;

const ExpectedResponseSchema = z.object({
    status: z.number(),
    data_raw: z.any().optional(),
    data: z.string(),
    errors: z.array(z.string()),
});

export const http = axios.create({
    baseURL: (import.meta.env.VITE_API_ENDPOINT ?? "http://localhost:8080") + "/api",
    transformResponse: (data, headers) => {
        if (contentType.parse(headers.get("content-type") as string).type !== "application/json")
            return data;

        const jsonParseResult = safeParseJson(data);

        if (!jsonParseResult.success) return data;

        const parseResult = ExpectedResponseSchema.safeParse(jsonParseResult.data);

        if (!parseResult.success) return data;

        return {
            ...parseResult.data,
            data: superjson.parse(parseResult.data.data),
        };
    },
});

http.interceptors.request.use((config) => {
    const { token } = useTokenStore.getState();

    if (token.length > 0) config.headers.set("Authorization", `Bearer ${token}`);

    return config;
});

http.interceptors.response.use((resp) => {
    if (resp.status === 401 || resp.status === 403)
        useTokenStore.setState({
            token: "",
        });

    return resp;
});

export const wrapAxios = <T>(request: Promise<AxiosResponse<ServerData<T>>>): Promise<T> =>
    request.then((data) => data.data.data);
