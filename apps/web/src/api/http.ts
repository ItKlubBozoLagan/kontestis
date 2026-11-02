import axios, { AxiosError, type AxiosResponse } from "axios";
import { toast } from "sonner";
import superjson from "superjson";

import { i18n } from "@/i18n/i18n";
import { useOrganisationStore } from "@/stores/organisation";
import { useSessionStore } from "@/stores/session";

export const API_BASE_URL = (import.meta.env.VITE_API_ENDPOINT ?? "http://localhost:8080") + "/api";

type Envelope = {
    status: number;
    data: string;
    data_raw?: unknown;
    errors: string[];
};

const isEnvelope = (value: unknown): value is Envelope =>
    typeof value === "object" &&
    value !== null &&
    "status" in value &&
    "errors" in value &&
    "data" in value &&
    typeof (value as Envelope).data === "string";

export class HttpError extends Error {
    readonly status?: number;
    readonly code?: string;

    constructor(error: unknown) {
        let message = "Something went wrong, try refreshing the page.";
        let status: number | undefined;
        let code: string | undefined;

        if (error instanceof AxiosError) {
            status = error.response?.status;
            ({ code } = error);
            const body = error.response?.data;

            message =
                body && typeof body === "object" && Array.isArray((body as Envelope).errors)
                    ? (body as Envelope).errors[0] ?? error.message
                    : error.message;
        }

        super(message);
        this.status = status;
        this.code = code;
    }
}

/**
 * Shared Axios instance. Every JSON response from the backend is an envelope whose `data` field
 * is SuperJSON encoded (bigints, dates); `api*` helpers below return the decoded payload.
 */
export const http = axios.create({ baseURL: API_BASE_URL });

http.interceptors.request.use((config) => {
    const { token } = useSessionStore.getState();
    const { organisationId } = useOrganisationStore.getState();

    if (token) config.headers.set("Authorization", `Bearer ${token}`);

    if (organisationId) config.headers.set("X-Kontestis-Org-Id", organisationId);

    return config;
});

let lastNetworkToast = 0;

http.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error instanceof AxiosError) {
            const status = error.response?.status;

            if (status === 429) toast.warning(i18n.t("errors.rateLimit"));

            if (status === 401 && useSessionStore.getState().token) {
                useSessionStore.getState().logout();
            }

            if (error.code === "ERR_NETWORK" && Date.now() - lastNetworkToast > 10_000) {
                lastNetworkToast = Date.now();
                toast.error(i18n.t("errors.unavailable"));
            }
        }

        return Promise.reject(new HttpError(error));
    }
);

const unwrap = <T>(response: AxiosResponse<unknown>): T => {
    const body = response.data;

    if (!isEnvelope(body)) return body as T;

    return superjson.parse<T>(body.data);
};

export const api = {
    get: <T>(url: string, params?: Record<string, unknown>) =>
        http.get(url, { params }).then(unwrap<T>),
    post: <T = void>(url: string, body?: unknown, params?: Record<string, unknown>) =>
        http.post(url, body ?? {}, { params }).then(unwrap<T>),
    patch: <T = void>(url: string, body?: unknown) => http.patch(url, body ?? {}).then(unwrap<T>),
    delete: <T = void>(url: string) => http.delete(url).then(unwrap<T>),
    upload: <T = void>(url: string, field: string, file: Blob) => {
        const form = new FormData();

        form.append(field, file);

        return http.post(url, form).then(unwrap<T>);
    },
};
