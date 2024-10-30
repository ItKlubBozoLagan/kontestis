import { CredentialResponse, GoogleLogin, GoogleOAuthProvider } from "@react-oauth/google";
import React, { FC, useCallback, useEffect, useState } from "react";
import tw from "twin.macro";

import { http, ServerData } from "../../api/http";
import { TitledSection } from "../../components/TitledSection";
import { useTranslation } from "../../hooks/useTranslation";
import { useTokenStore } from "../../state/token";

const LoginBase: FC = () => {
    const { setToken } = useTokenStore();

    const [aaiEduUrl, setAaiEduUrl] = useState<string>();

    const onGoogleLoginSuccess = useCallback((credentialResponse: CredentialResponse) => {
        const { credential } = credentialResponse;

        if (!credential) return;

        http.post<ServerData<{ token: string }>>("/auth/google-login", credentialResponse).then(
            (data) => setToken(data.data.data.token)
        );
    }, []);

    const { t } = useTranslation();

    useEffect(() => {
        http.get<ServerData<{ url: string }>>("auth/aai-edu/url")
            .then((data) => data.data)
            .then((it) => setAaiEduUrl(it.data.url));
    }, []);

    const onAaiEduClick = useCallback(() => {
        if (!aaiEduUrl) return;

        document.location.href = aaiEduUrl;
    }, [aaiEduUrl]);

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
                    <div
                        css={[
                            tw`w-[256px] flex items-center justify-center border border-solid border-neutral-200 rounded px-2 py-3 text-center select-none`,
                            tw`cursor-pointer hover:bg-neutral-100 transition-colors`,
                        ]}
                        onClick={onAaiEduClick}
                    >
                        AAI@EduHr Login
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
