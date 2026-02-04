import { safeParseJson } from "@kontestis/utils";
import axios, { AxiosError, AxiosResponse } from "axios";
import contentType from "content-type";
import superjson from "superjson";
import { z } from "zod";

import { useAuthStore } from "@/store/auth";
import { useOrganisationStore } from "@/store/organisation";
import { useTokenStore } from "@/store/token";

export type ServerData<T> = { data: T };

export class HttpError extends Error {
    public readonly status: number;
    public readonly errors: string[];

    constructor(status: number, errors: string[]) {
        super(errors[0] ?? "Unknown error");
        this.status = status;
        this.errors = errors;
    }
}

const ExpectedResponseSchema = z.object({
    status: z.number(),
    data_raw: z.any().optional(),
    data: z.string(),
    errors: z.array(z.string()),
});

export const http = axios.create({
    baseURL: (import.meta.env.VITE_API_ENDPOINT ?? "http://localhost:8080") + "/api",
    transformResponse: (data, headers) => {
        const contentTypeHeader = headers.get?.("content-type") as string | undefined;

        if (!contentTypeHeader) return data;

        try {
            if (contentType.parse(contentTypeHeader).type !== "application/json") {
                return data;
            }
        } catch {
            return data;
        }

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

// Request interceptor
http.interceptors.request.use((config) => {
    const { token } = useTokenStore.getState();
    const { isSelected, organisationId } = useOrganisationStore.getState();

    if (token.length > 0) {
        config.headers.set("Authorization", `Bearer ${token}`);
    }

    if (isSelected) {
        config.headers.set("X-Kontestis-Org-Id", organisationId.toString());
    }

    return config;
});

// Response interceptor
http.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
        const responseStatus = error.response?.status;

        if (responseStatus) {
            const { token } = useTokenStore.getState();

            if (token?.length > 0 && responseStatus === 401) {
                useAuthStore.getState().doForceLogout();
            }
        }

        return Promise.reject(error);
    }
);

export async function wrapAxios<T>(promise: Promise<AxiosResponse<ServerData<T>>>): Promise<T> {
    try {
        const response = await promise;

        return response.data.data;
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            const { status, data } = error.response;
            const parsedData = data as { errors?: string[] };

            throw new HttpError(status, parsedData?.errors ?? ["Unknown error"]);
        }

        throw error;
    }
}
