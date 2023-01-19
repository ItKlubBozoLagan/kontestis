import axios, { AxiosResponse } from "axios";

export const http = axios.create({
    baseURL: "http://localhost:8080/api",
});

export const wrapAxios = <T>(
    request: Promise<AxiosResponse<{ data: T }>>
): Promise<T> => request.then((data) => data.data.data);
