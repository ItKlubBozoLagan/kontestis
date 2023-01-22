import axios, { AxiosRequestConfig, AxiosResponse } from "axios";

import { useAuthStore } from "../state/auth";

export const http = axios.create({
    baseURL:
        (import.meta.env.VITE_API_ENDPOINT ?? "http://localhost:8080") + "/api",
});

console.log(http.defaults.baseURL);

http.interceptors.request.use((config: AxiosRequestConfig) => {
    const { token } = useAuthStore.getState();

    if (token.length > 0)
        config.headers.set("Authorization", `Bearer ${token}`);

    return config;
});

export const wrapAxios = <T>(
    request: Promise<AxiosResponse<{ data: T }>>
): Promise<T> => request.then((data) => data.data.data);
