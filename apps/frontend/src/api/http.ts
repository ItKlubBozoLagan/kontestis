import axios, { AxiosResponse } from "axios";
import {
    UseMutationOptions,
    UseMutationResult,
    UseQueryOptions,
    UseQueryResult,
} from "react-query";

import { useAuthStore } from "../state/auth";
import { HttpError } from "./HttpError";

export type ServerData<T> = { data: T };

export type MutationHandler<TVariables, TData, Parameter = never> = [
    Parameter
] extends [never]
    ? (
          options?: UseMutationOptions<TData, HttpError, TVariables>
      ) => UseMutationResult<TData, HttpError, TVariables>
    : (
          parameters: Parameter,
          options?: UseMutationOptions<TData, HttpError, TVariables>
      ) => UseMutationResult<TData, HttpError, TVariables>;

type QueryOptions<TData> = UseQueryOptions<
    unknown,
    HttpError,
    TData,
    (string | number | bigint)[]
>;

export type QueryHandler<TData, Parameter = never> = [Parameter] extends [never]
    ? (options?: QueryOptions<TData>) => UseQueryResult<TData, HttpError>
    : (
          parameters: Parameter,
          options?: QueryOptions<TData>
      ) => UseQueryResult<TData, HttpError>;

export const http = axios.create({
    baseURL:
        (import.meta.env.VITE_API_ENDPOINT ?? "http://localhost:8080") + "/api",
});

http.interceptors.request.use((config) => {
    const { token } = useAuthStore.getState();

    if (token.length > 0)
        config.headers.set("Authorization", `Bearer ${token}`);

    return config;
});

export const wrapAxios = <T>(
    request: Promise<AxiosResponse<ServerData<T>>>
): Promise<T> => request.then((data) => data.data.data);
