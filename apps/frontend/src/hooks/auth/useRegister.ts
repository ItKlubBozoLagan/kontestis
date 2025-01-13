import { useMutation } from "react-query";

import { http, MutationHandler, wrapAxios } from "../../api/http";

type RegisterVariables = {
    data: {
        email: string;
        password: string;
        full_name: string;
        picture_url?: string;
    };
    captcha_token: string;
};

export const useRegister: MutationHandler<RegisterVariables, undefined> = (options) =>
    useMutation(
        ({ data, captcha_token }) =>
            wrapAxios(
                http.post(
                    `/auth/managed/register?captcha_token=${encodeURIComponent(captcha_token)}`,
                    data
                )
            ),
        options
    );
