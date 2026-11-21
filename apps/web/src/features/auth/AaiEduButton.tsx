import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router";

import { authQueries } from "@/api/auth";
import { Button } from "@/components/ui/button";
import { rememberLoginRedirect } from "@/lib/loginRedirect";

export const AaiEduButton = ({ purpose }: { purpose: "login" | "link" }) => {
    const { t } = useTranslation();
    const { data } = useQuery(authQueries.aaiEduUrl(purpose));
    const [params] = useSearchParams();

    return (
        <Button
            variant="outline"
            className="h-11 w-64 gap-2"
            disabled={!data}
            onClick={() => {
                if (!data) return;

                if (purpose === "login") rememberLoginRedirect(params.get("redirect"));

                window.location.href = data.url;
            }}
        >
            <img src="/aai-edu.svg" alt="AAI@EduHr" className="h-5" />
            {purpose === "link" && <span className="font-semibold">{t("auth.aai.link")}</span>}
        </Button>
    );
};
