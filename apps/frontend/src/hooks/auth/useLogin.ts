import { useMutation } from "react-query";

import { http, MutationHandler, wrapAxios } from "../../api/http";

type LoginVariables = {
    data: {
        email: string;
        password: string;
    };
    captcha_token: string;
};

type LoginData = {
    token: string;
};

export const useLogin: MutationHandler<LoginVariables, LoginData> = (options) =>
    useMutation(
        ({ data, captcha_token }) =>
            wrapAxios(
                http.post(
                    `/auth/managed/login?captcha_token=${encodeURIComponent(captcha_token)}`,
                    data
                )
            ),
        options
    );
