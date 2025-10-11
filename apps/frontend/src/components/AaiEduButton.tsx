import React, { FC, useCallback, useEffect, useState } from "react";
import tw from "twin.macro";

import aaiEduLogo from "/aai-edu.svg";

import { http, ServerData } from "../api/http";
import { useTranslation } from "../hooks/useTranslation";

type Properties = {
    purpose: "login" | "link";
};

export const AaiEduButton: FC<Properties> = ({ purpose }) => {
    const [aaiEduUrl, setAaiEduUrl] = useState<string>();

    const { t } = useTranslation();

    useEffect(() => {
        http.get<ServerData<{ url: string }>>(`auth/aai-edu/url?purpose=${purpose}`)
            .then((data) => data.data)
            .then((it) => setAaiEduUrl(it.data.url));
    }, []);

    const onAaiEduClick = useCallback(() => {
        if (!aaiEduUrl) return;

        document.location.href = aaiEduUrl;
    }, [aaiEduUrl]);

    return (
        <div
            css={[
                tw`w-[256px] flex gap-2 items-center justify-center border border-solid border-neutral-200 rounded px-2 py-3 text-center select-none`,
                tw`cursor-pointer hover:bg-neutral-100 transition-colors`,
            ]}
            onClick={onAaiEduClick}
        >
            <img src={aaiEduLogo} alt="AAI@EduHR" tw={"w-32"} />
            {purpose === "link" && (
                <span tw={"font-bold mt-1"}>{t("aaieduButton.purposeLink")}</span>
            )}
        </div>
    );
};
