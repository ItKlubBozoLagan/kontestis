import { FC, useCallback } from "react";
import { Outlet } from "react-router";

import { Button } from "@/components/ui/button";
import { useCopy } from "@/hooks/useCopy";
import { useTokenStore } from "@/state/token";

export const Root: FC = () => {
    // const { currentLanguage, setLanguage } = useLanguageContext();

    const { token } = useTokenStore();

    const { copy, copied } = useCopy();

    const copyToken = useCallback(() => {
        copy(token);
    }, [token]);

    // const { t } = useTranslation();

    return (
        <div className={"w-full flex flex-col items-center"}>
            {
                <div
                    className={
                        "flex flex-col w-full max-w-[1000px] items-center justify-start gap-4 py-6 px-12"
                    }
                >
                    <Outlet />
                </div>
            }
            {/*<div className={"fixed right-6 bottom-6 flex gap-2"}>*/}
            {/*    {I18N_AVAILABLE_LANGUAGES.filter((it) => it !== currentLanguage).map((language) => (*/}
            {/*        <Button*/}
            {/*            key={language}*/}
            {/*            onClick={() => setLanguage(language)}*/}
            {/*            variant={"secondary"}*/}
            {/*        >*/}
            {/*            <div className={"flex gap-2 items-center"}>*/}
            {/*                <img*/}
            {/*                    src={`https://flagcdn.com/16x12/${language.replace(*/}
            {/*                        /^en$/,*/}
            {/*                        "gb"*/}
            {/*                    )}.webp`}*/}
            {/*                    alt={`${language} flag`}*/}
            {/*                />*/}
            {/*                {language.toUpperCase()}*/}
            {/*            </div>*/}
            {/*        </Button>*/}
            {/*    ))}*/}
            {/*</div>*/}
            {import.meta.env.DEV && (
                <div className={"fixed left-6 bottom-6"}>
                    <Button disabled={copied} onClick={copyToken} variant={"secondary"}>
                        <b>Dev:</b> {copied ? "Copied" : "Copy token"}
                    </Button>
                </div>
            )}
        </div>
    );
};
