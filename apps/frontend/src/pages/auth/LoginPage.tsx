import { GoogleOAuthProvider, useGoogleLogin } from "@react-oauth/google";
import React, { FC } from "react";

import { GoogleButton } from "../../components/GoogleButton";
import { TitledSection } from "../../components/TitledSection";

const LoginBase: FC = () => {
    const googleLogin = useGoogleLogin({
        onSuccess: console.log,
        hosted_domain: "skole.hr",
        flow: "auth-code",
        ux_mode: "popup",
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
                        domains
                    </span>
                    <GoogleButton onClick={() => googleLogin()}>
                        Sign in with Google
                    </GoogleButton>
                </div>
            </TitledSection>
        </div>
    );
};

export const LoginPage: FC = () => (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
        <LoginBase />
    </GoogleOAuthProvider>
);
