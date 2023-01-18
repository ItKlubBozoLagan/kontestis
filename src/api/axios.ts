import axios, { AxiosResponse } from "axios";
import {Globals} from "../globals";

export const httpEvaluator = axios.create({
    baseURL: Globals.evaluatorURL,
});

export const wrapAxios = <T>(request: Promise<AxiosResponse<T>>): Promise<T> =>
request.then((data) => data.data);