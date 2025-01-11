import { CredentialResponse, GoogleLogin, GoogleOAuthProvider } from "@react-oauth/google";
import React, { FC, useCallback } from "react";

import { http, ServerData } from "../../api/http";
import { AaiEduButton } from "../../components/AaiEduButton";
import { TitledSection } from "../../components/TitledSection";
import { useTranslation } from "../../hooks/useTranslation";
import { useTokenStore } from "../../state/token";
import { ManagedLoginForm } from "./ManagedLoginForm";

const LoginBase: FC = () => {
    const { setToken } = useTokenStore();

    const onGoogleLoginSuccess = useCallback((credentialResponse: CredentialResponse) => {
        const { credential } = credentialResponse;

        if (!credential) return;

        http.post<ServerData<{ token: string }>>("/auth/google-login", credentialResponse).then(
            (data) => setToken(data.data.data.token)
        );
    }, []);

    const { t } = useTranslation();

    return (
        <div tw={"w-full md:max-w-[768px] mt-20"}>
            <TitledSection title={t("login.label")}>
                <div tw={"flex gap-4 justify-center items-stretch w-full py-12"}>
                    <div tw={"flex flex-col gap-4 items-center w-full px-12 py-4"}>
                        <span tw={"text-lg"}>Log in with email</span>
                        <div tw={"w-full flex flex-col gap-4 items-center flex-grow"}>
                            <ManagedLoginForm />
                        </div>
                    </div>
                    <div tw={"flex-shrink-0 flex flex-col items-center justify-center gap-1"}>
                        <div tw={"w-[1px] flex-grow bg-neutral-400"}></div>
                        <span tw={"text-neutral-800 mb-1"}>or</span>
                        <div tw={"w-[1px] flex-grow bg-neutral-400"}></div>
                    </div>
                    <div tw={"flex flex-col gap-6 items-center w-full py-4"}>
                        <span tw={"text-lg"}>Log in with SSO</span>
                        <div
                            tw={"flex flex-col flex-grow gap-6 items-center justify-center w-full"}
                        >
                            <GoogleLogin
                                onSuccess={onGoogleLoginSuccess}
                                width={"256px"}
                                size={"large"}
                                text={"signin"}
                                theme={"outline"}
                                shape={"rectangular"}
                                auto_select={true}
                            />
                            <AaiEduButton purpose={"login"} />
                        </div>
                    </div>
                </div>
            </TitledSection>
        </div>
    );
};

export const LoginPage: FC = () => (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_OAUTH_CLIENT_ID}>
        <LoginBase />
    </GoogleOAuthProvider>
);
