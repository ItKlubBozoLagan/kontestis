import React, { FC, useCallback, useEffect, useState } from "react";

import aaiEduLogo from "/aai-edu.png";
import { http, ServerData } from "@/api/http";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/utils";

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
            className={cn(
                "w-[256px] flex gap-2 items-center justify-center border border-solid border-slate-500 rounded px-2 py-3 text-center select-none",
                "cursor-pointer bg-slate-600 text-neutral-200 hover:bg-slate-700 transition-colors"
            )}
            onClick={onAaiEduClick}
        >
            <img src={aaiEduLogo} alt="AAI@EduHR" className={"w-24"} />
            <span className={"font-bold"}>
                {purpose === "login"
                    ? t("aaieduButton.purposeLogin")
                    : t("aaieduButton.purposeLink")}
            </span>
        </div>
    );
};
