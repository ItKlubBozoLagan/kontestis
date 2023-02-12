import { AxiosResponse } from "axios";

export const wrapAxios = <T>(request: Promise<AxiosResponse<T>>): Promise<T> =>
    request.then((data) => data.data);
