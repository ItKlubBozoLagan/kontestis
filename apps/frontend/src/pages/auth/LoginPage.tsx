import {
    CodeResponse,
    GoogleOAuthProvider,
    useGoogleLogin,
} from "@react-oauth/google";
import React, { FC, useCallback } from "react";

import { http } from "../../api/http";
import { GoogleButton } from "../../components/GoogleButton";
import { TitledSection } from "../../components/TitledSection";

const LoginBase: FC = () => {
    const onLoginSuccess = useCallback((codeResponse: CodeResponse) => {
        console.log(codeResponse);
        http.post("/auth/google-login", codeResponse).then(console.log);
    }, []);

    console.log(import.meta.env.VITE_OAUTH_REDIRECT_URI);
    const googleLogin = useGoogleLogin({
        onSuccess: onLoginSuccess,
        redirect_uri: import.meta.env.VITE_OAUTH_REDIRECT_URI,
        flow: "auth-code",
        ux_mode: "redirect",
        select_account: true,
    });

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
                    <GoogleButton onClick={() => googleLogin()} />
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
