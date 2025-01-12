import { useMutation } from "react-query";

import { http, MutationHandler, wrapAxios } from "../../api/http";

type RegisterVariables = {
    email: string;
    password: string;
    full_name: string;
    picture_url?: string;
};

export const useRegister: MutationHandler<RegisterVariables, undefined> = (options) =>
    useMutation((variables) => wrapAxios(http.post("/auth/managed/register", variables)), options);
