import { CredentialResponse, GoogleLogin, GoogleOAuthProvider } from "@react-oauth/google";
import React, { FC, useCallback } from "react";

import { http, ServerData } from "../../api/http";
import { AaiEduButton } from "../../components/AaiEduButton";
import { TitledSection } from "../../components/TitledSection";
import { useTranslation } from "../../hooks/useTranslation";
import { useTokenStore } from "../../state/token";

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
        <div tw={"w-full md:max-w-[500px] mt-20"}>
            <TitledSection title={t("login.label")}>
                <div tw={"flex flex-col gap-6 items-center"}>
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
            </TitledSection>
        </div>
    );
};

export const LoginPage: FC = () => (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_OAUTH_CLIENT_ID}>
        <LoginBase />
    </GoogleOAuthProvider>
);
