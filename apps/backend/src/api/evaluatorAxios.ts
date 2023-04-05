import axios from "axios";

import { Globals } from "../globals";
import { getEvaluatorServiceToken } from "../lib/google";

export const evaluatorAxios = axios.create({
    baseURL: Globals.evaluatorEndpoint,
    timeout: 60_000,
});

evaluatorAxios.interceptors.request.use(async (config) => {
    const token = await getEvaluatorServiceToken();

    if (token) config.headers.set("X-Serverless-Authorization", `Bearer ${token}`);

    return config;
});
