import { useMutation } from "react-query";

import { http, MutationHandler, wrapAxios } from "../../api/http";

type OAuthAuthorizeVariables = {
    client_id: string;
    redirect_uri: string;
    state?: string;
};

type OAuthAuthorizeData = {
    redirect: string;
};

export const useOAuthAuthorize: MutationHandler<OAuthAuthorizeVariables, OAuthAuthorizeData> = (
    options
) => useMutation((variables) => wrapAxios(http.post("/oauth/authorize", variables)), options);
