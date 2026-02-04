import { FullUser } from "@kontestis/models";
import { useMutation, useQuery } from "@tanstack/react-query";

import { useTokenStore } from "@/store/token";

import { http, HttpError, ServerData, wrapAxios } from "./http";

export function useCurrentUser() {
    return useQuery<FullUser, HttpError>({
        queryKey: ["auth", "user"],
        queryFn: () => wrapAxios(http.get("/auth/info")),
    });
}

interface GoogleLoginInput {
    credential: string;
    clientId?: string;
    select_by?: string;
}

export function useGoogleLogin() {
    const { setToken } = useTokenStore.getState();

    return useMutation<{ token: string }, HttpError, GoogleLoginInput>({
        mutationFn: async (data) => {
            const response = await http.post<ServerData<{ token: string }>>(
                "/auth/google-login",
                data
            );

            return response.data.data;
        },
        onSuccess: (data) => {
            setToken(data.token);
        },
    });
}

interface ManagedLoginInput {
    email: string;
    password: string;
}

export function useManagedLogin() {
    const { setToken } = useTokenStore.getState();

    return useMutation<{ token: string }, HttpError, ManagedLoginInput>({
        mutationFn: async (data) => {
            const response = await http.post<ServerData<{ token: string }>>(
                "/auth/managed/login",
                data
            );

            return response.data.data;
        },
        onSuccess: (data) => {
            setToken(data.token);
        },
    });
}

interface RegisterInput {
    email: string;
    full_name: string;
    password: string;
    captcha_token: string;
}

export function useRegister() {
    return useMutation<void, HttpError, RegisterInput>({
        mutationFn: ({ captcha_token, ...data }) =>
            wrapAxios(
                http.post(
                    `/auth/managed/register?captcha_token=${encodeURIComponent(captcha_token)}`,
                    data
                )
            ),
    });
}

// AAI@EduHr authentication
export function useAaiEduUrl(purpose: "login" | "link") {
    return useQuery<{ url: string }, HttpError>({
        queryKey: ["auth", "aai-edu-url", purpose],
        queryFn: () => wrapAxios(http.get(`/auth/aai-edu/url?purpose=${purpose}`)),
    });
}

interface AaiEduTokenInput {
    authorization_code: string;
}

export function useAaiEduToken() {
    const { setToken } = useTokenStore.getState();

    return useMutation<{ token: string }, HttpError, AaiEduTokenInput>({
        mutationFn: async (data) => {
            const response = await http.post<ServerData<{ token: string }>>(
                "/auth/aai-edu/token",
                data
            );

            return response.data.data;
        },
        onSuccess: (data) => {
            setToken(data.token);
        },
    });
}
