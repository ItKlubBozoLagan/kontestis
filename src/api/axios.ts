import axios, {AxiosResponse} from "axios";

export const http = axios.create({
    baseURL: "http://localhost:8080/api",
});

export const wrapAxios = <T>(request: Promise<AxiosResponse<T>>): Promise<T> =>
    request.then(data => data.data);