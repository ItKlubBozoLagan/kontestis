import {
    CredentialResponse,
    GoogleLogin,
    GoogleOAuthProvider,
} from "@react-oauth/google";
import React, { FC, useCallback } from "react";

import { http } from "../../api/http";
import { TitledSection } from "../../components/TitledSection";
import { useAuthStore } from "../../state/auth";

const LoginBase: FC = () => {
    const { setToken } = useAuthStore();

    const onLoginSuccess = useCallback(
        (credentialResponse: CredentialResponse) => {
            const { credential } = credentialResponse;

            if (!credential) return;

            http.post("/auth/google-login", credentialResponse).then(() =>
                setToken(credential)
            );
        },
        []
    );

    return (
        <div tw={"w-full md:max-w-[500px] mt-20"}>
            <TitledSection title={"Log in"}>
                <div tw={"flex flex-col gap-6 items-center"}>
                    <span>
                        Login is currently only limited to{" "}
                        <a
                            tw={
                                "font-mono rounded bg-neutral-100 border border-solid border-neutral-300 px-1 no-underline hover:bg-neutral-200"
                            }
                            href={"https://skole.hr"}
                            target={"_blank"}
                            rel="noreferrer"
                        >
                            skole.hr
                        </a>{" "}
                        accounts
                    </span>
                    <GoogleLogin
                        onSuccess={onLoginSuccess}
                        hosted_domain={"skole.hr"}
                        width={"256px"}
                        size={"large"}
                        text={"signin"}
                        theme={"outline"}
                        shape={"rectangular"}
                        auto_select={true}
                    />
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
