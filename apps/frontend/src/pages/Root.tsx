import { FC, useCallback, useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router";
import tw from "twin.macro";

import { NavBar } from "../components/NavBar";
import { SimpleButton } from "../components/SimpleButton";
import { useLanguageContext } from "../context/useLanguageContext";
import { useCopy } from "../hooks/useCopy";
import { useTranslation } from "../hooks/useTranslation";
import { I18N_AVAILABLE_LANGUAGES } from "../i18n/i18n";
import { useBackendError } from "../state/backendError";
import { useTokenStore } from "../state/token";

type Properties = {
    hideNavbar?: boolean;
};

export const Root: FC<Properties> = ({ hideNavbar = false }) => {
    const { currentLanguage, setLanguage } = useLanguageContext();
    const { lastUpdate, backendError, setBackendError } = useBackendError();
    const { token } = useTokenStore();

    const location = useLocation();

    const { copy, copied } = useCopy();

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

    const copyToken = useCallback(() => {
        copy(token);
    }, [token]);

    const { t } = useTranslation();

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
            <div
                tw={"fixed right-6 bottom-6 flex gap-2"}
                css={location.pathname.startsWith("/register") ? tw`bottom-28` : ""}
            >
                {I18N_AVAILABLE_LANGUAGES.filter((it) => it !== currentLanguage).map((language) => (
                    <SimpleButton key={language} onClick={() => setLanguage(language)}>
                        <div tw={"flex gap-2 items-center"}>
                            <img
                                src={`country_flags/${language.replace(/^en$/, "gb")}.webp`}
                                alt={`${language} flag`}
                            />
                            {language.toUpperCase()}
                        </div>
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
                        <span tw={"text-xl font-bold flex gap-2 items-center"}>
                            {t("backendErrors.unavailable.header")}
                        </span>
                        <span>{t("backendErrors.unavailable.description")}</span>
                    </div>
                ) : (
                    <div
                        css={[
                            tw`fixed p-2 left-6 bottom-6 flex gap-2 bg-yellow-300 border-2 border-solid border-yellow-500`,
                            tw`flex flex-col max-w-[256px]`,
                        ]}
                    >
                        <span tw={"text-xl font-bold flex gap-2 items-center"}>
                            {t("backendErrors.rateLimit.header")}
                        </span>
                        <span>{t("backendErrors.rateLimit.description")}</span>
                    </div>
                ))}
            {import.meta.env.DEV && (
                <div tw={"fixed left-6 bottom-6"}>
                    <SimpleButton onClick={copyToken}>
                        {copied ? "Copied" : "Copy token"}
                    </SimpleButton>
                </div>
            )}
        </div>
    );
};
