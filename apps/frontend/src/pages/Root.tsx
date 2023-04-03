import { FC } from "react";
import { Outlet } from "react-router";

import { NavBar } from "../components/NavBar";
import { SimpleButton } from "../components/SimpleButton";
import { useLanguageContext } from "../context/useLanguageContext";
import { I18N_AVAILABLE_LANGUAGES } from "../i18n/i18n";

type Properties = {
    hideNavbar?: boolean;
};

export const Root: FC<Properties> = ({ hideNavbar = false }) => {
    const { setLanguage } = useLanguageContext();

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
            <div tw={"fixed p-4 right-6 bottom-6 flex gap-2"}>
                {I18N_AVAILABLE_LANGUAGES.map((language) => (
                    <SimpleButton key={language} onClick={() => setLanguage(language)}>
                        {language}
                    </SimpleButton>
                ))}
            </div>
        </div>
    );
};
