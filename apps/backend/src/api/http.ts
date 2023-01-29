import axios, { AxiosResponse } from "axios";

import { Globals } from "../globals";

export const httpEvaluatorInstance = axios.create({
    baseURL: Globals.evaluatorEndpoint,
});

export const wrapAxios = <T>(request: Promise<AxiosResponse<T>>): Promise<T> =>
    request.then((data) => data.data);
