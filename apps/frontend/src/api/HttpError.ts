import { AxiosError } from "axios";

const parseAxiosError = (error: AxiosError): string => {
    const { response, message } = error;

    if (
        !response?.data ||
        typeof response.data !== "object" ||
        !("errors" in response.data)
    )
        return message;

    const data = response.data as { errors: string[] };

    if (!Array.isArray(data.errors) || data.errors.length === 0) return message;

    return data.errors[0];
};

export class HttpError extends Error {
    public readonly code?: string;
    public readonly status?: number;

    constructor(error: unknown) {
        super(
            error instanceof AxiosError
                ? parseAxiosError(error)
                : "There was an issue with gathering your information. Try refreshing the page."
        );
        this.code = error instanceof AxiosError ? error.code : undefined;
        this.status =
            error instanceof AxiosError ? error.response?.status : undefined;
    }
}
