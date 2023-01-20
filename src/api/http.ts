import axios, { AxiosRequestConfig, AxiosResponse } from "axios";

import { useAuthStore } from "../state/auth";

export const http = axios.create({
    baseURL: "https://kontestis.antony.cash/api",
});

http.interceptors.request.use((config: AxiosRequestConfig) => {
    const { token } = useAuthStore.getState();

    if (token.length > 0)
        config.headers.set("Authorization", `Bearer ${token}`);

    return config;
});

export const wrapAxios = <T>(
    request: Promise<AxiosResponse<{ data: T }>>
): Promise<T> => request.then((data) => data.data.data);
