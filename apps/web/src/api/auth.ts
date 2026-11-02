import type { FullUser, User } from "@kontestis/models";
import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/api/http";
import { useSessionStore } from "@/stores/session";

type TokenResponse = { token: string };

export const authQueries = {
    me: (token: string | null) =>
        queryOptions({
            queryKey: ["auth", "me", token],
            queryFn: () => api.get<FullUser>("/auth/info"),
            enabled: !!token,
            staleTime: 60_000,
        }),
    aaiEduUrl: (purpose: "login" | "link") =>
        queryOptions({
            queryKey: ["auth", "aai-edu-url", purpose],
            queryFn: () => api.get<{ url: string }>("/auth/aai-edu/url", { purpose }),
            staleTime: Number.POSITIVE_INFINITY,
        }),
};

/** The logged in user. Only call below `RequireAuth`, which guarantees the data is loaded. */
export const useCurrentUser = (): FullUser => {
    const token = useSessionStore((state) => state.token);
    const { data } = useQuery(authQueries.me(token));

    if (!data) throw new Error("useCurrentUser used outside of an authenticated route");

    return data;
};

const useTokenMutation = <Variables>(request: (variables: Variables) => Promise<TokenResponse>) => {
    const setToken = useSessionStore((state) => state.setToken);

    return useMutation({
        mutationFn: request,
        onSuccess: ({ token }) => setToken(token),
        // login forms render their own, more specific error messages
        meta: { silent: true },
    });
};

export const useManagedLogin = () =>
    useTokenMutation(({ captcha, ...body }: { email: string; password: string; captcha: string }) =>
        api.post<TokenResponse>("/auth/managed/login", body, { captcha_token: captcha })
    );

export const useTemporaryLogin = () =>
    useTokenMutation((body: { username: string; password: string }) =>
        api.post<TokenResponse>("/auth/temporary/login", body)
    );

export const useGoogleLogin = () =>
    useTokenMutation((credential: string) =>
        api.post<TokenResponse>("/auth/google-login", { credential })
    );

export const useAaiEduExchange = () =>
    useTokenMutation((authorizationCode: string) =>
        api.post<TokenResponse>("/auth/aai-edu/token", { authorization_code: authorizationCode })
    );

export const useRegister = () =>
    useMutation({
        mutationFn: ({
            captcha,
            ...body
        }: {
            email: string;
            password: string;
            full_name: string;
            picture_url?: string;
            captcha: string;
        }) => api.post<User>("/auth/managed/register", body, { captcha_token: captcha }),
        meta: { silent: true },
    });

export const useBulkCreateTemporaryUsers = () =>
    useMutation({
        mutationFn: (body: { names: string[]; contest_ids: string[]; prefix: string }) =>
            api.post<{ name: string; username: string; password: string }[]>(
                "/auth/temporary/bulk-create",
                body
            ),
    });

export const useLogout = () => {
    const queryClient = useQueryClient();
    const logout = useSessionStore((state) => state.logout);

    return () => {
        const { token } = useSessionStore.getState();
        const payload = decodeAaiIdToken(token);

        logout();
        queryClient.clear();

        if (payload && import.meta.env.VITE_AAI_EDU_LOGOUT_URL) {
            const url = new URL(import.meta.env.VITE_AAI_EDU_LOGOUT_URL);

            url.searchParams.set("id_token_hint", payload);

            if (import.meta.env.VITE_AAI_EDU_LOGOUT_REDIRECT_URL)
                url.searchParams.set(
                    "post_logout_redirect_uri",
                    import.meta.env.VITE_AAI_EDU_LOGOUT_REDIRECT_URL
                );

            window.location.href = url.toString();
        }
    };
};

const decodeAaiIdToken = (token: string | null): string | null => {
    const payload = token?.split(".").at(1);

    if (!payload) return null;

    try {
        const data = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));

        return typeof data.id_token === "string" ? data.id_token : null;
    } catch {
        return null;
    }
};
