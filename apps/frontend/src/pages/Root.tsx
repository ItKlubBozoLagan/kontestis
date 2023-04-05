import { FC, useEffect, useState } from "react";
import { Outlet } from "react-router";
import tw from "twin.macro";

import { NavBar } from "../components/NavBar";
import { SimpleButton } from "../components/SimpleButton";
import { useLanguageContext } from "../context/useLanguageContext";
import { I18N_AVAILABLE_LANGUAGES } from "../i18n/i18n";
import { useBackendError } from "../state/backendError";

type Properties = {
    hideNavbar?: boolean;
};

export const Root: FC<Properties> = ({ hideNavbar = false }) => {
    const { setLanguage } = useLanguageContext();
    const { lastUpdate, backendError, setBackendError } = useBackendError();

    const [errorTimeout, setErrorTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (errorTimeout) clearTimeout(errorTimeout);

        const timeout = setTimeout(() => {
            setBackendError("none");
        }, 4000);

        setErrorTimeout(timeout);

        return () => {
            errorTimeout && clearTimeout(errorTimeout);
        };
    }, [lastUpdate]);

    return (
        <div tw={"w-full flex flex-col items-center"}>
            {!hideNavbar && <NavBar />}
            {
                <div
                    tw={
                        "flex flex-col w-full max-w-[1000px] items-center justify-start gap-4 py-6 px-12"
                    }
                >
                    <Outlet />
                </div>
            }
            <div tw={"fixed right-6 bottom-6 flex gap-2"}>
                {I18N_AVAILABLE_LANGUAGES.map((language) => (
                    <SimpleButton key={language} onClick={() => setLanguage(language)}>
                        {language}
                    </SimpleButton>
                ))}
            </div>
            {backendError !== "none" &&
                (backendError === "unavailable" ? (
                    <div
                        css={[
                            tw`fixed p-2 left-6 bottom-6 flex gap-2 bg-red-500 border-4 border-solid border-red-700`,
                            tw`flex flex-col max-w-[256px]`,
                        ]}
                    >
                        <span tw={"text-xl font-bold flex gap-2 items-center"}>Sorry</span>
                        <span>We seem to be experiencing some problems right now</span>
                    </div>
                ) : (
                    <div
                        css={[
                            tw`fixed p-2 left-6 bottom-6 flex gap-2 bg-yellow-300 border-2 border-solid border-yellow-500`,
                            tw`flex flex-col max-w-[256px]`,
                        ]}
                    >
                        <span tw={"text-xl font-bold flex gap-2 items-center"}>Slow down!</span>
                        <span>You have been rate limited.</span>
                    </div>
                ))}
        </div>
    );
};
