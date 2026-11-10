import { queryOptions, useMutation } from "@tanstack/react-query";

import { api } from "@/api/http";

type AuthorizationRequest = { client_id: string; redirect_uri: string; state?: string };

export const oauthQueries = {
    client: (clientId: string, redirectUri: string) =>
        queryOptions({
            queryKey: ["oauth", "client", clientId, redirectUri],
            queryFn: () =>
                api.get<{ name: string }>("/oauth/client", {
                    client_id: clientId,
                    redirect_uri: redirectUri,
                }),
            // an unknown client or redirect URI is a 404, retrying won't change that
            retry: false,
            staleTime: Number.POSITIVE_INFINITY,
        }),
};

export const useOAuthAuthorize = () =>
    useMutation({
        mutationFn: (body: AuthorizationRequest) =>
            api.post<{ redirect: string }>("/oauth/authorize", body),
        meta: { silent: true },
    });
