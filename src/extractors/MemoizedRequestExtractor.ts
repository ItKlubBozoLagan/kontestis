import { Request } from "express";

export const memoizedRequestExtractor = async <T>(
    req: Request,
    key: string,
    function_: () => Promise<T>
): Promise<T> => {
    const reqKey = key as keyof Request;

    if (req[reqKey]) return req[reqKey];

    // @ts-ignore
    req[key] = await function_();

    return req[reqKey];
};
