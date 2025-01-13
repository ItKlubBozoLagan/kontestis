import { useMutation } from "react-query";

import { http, MutationHandler, wrapAxios } from "../../api/http";

type LoginVariables = {
    email: string;
    password: string;
};

type LoginData = {
    token: string;
};

export const useLogin: MutationHandler<LoginVariables, LoginData> = (options) =>
    useMutation((variables) => wrapAxios(http.post("/auth/managed/login", variables)), options);
