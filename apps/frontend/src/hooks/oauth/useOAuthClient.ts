import { useQuery } from "react-query";

import { http, QueryHandler, wrapAxios } from "../../api/http";

type OAuthClientParameters = {
    clientId: string;
    redirectUri: string;
};

type OAuthClient = {
    name: string;
};

export const useOAuthClient: QueryHandler<OAuthClient, OAuthClientParameters> = (
    { clientId, redirectUri },
    options
) =>
    useQuery({
        queryKey: ["oauth", "client", clientId, redirectUri],
        queryFn: () =>
            wrapAxios(
                http.get("/oauth/client", {
                    params: { client_id: clientId, redirect_uri: redirectUri },
                })
            ),
        retry: false,
        ...options,
    });
