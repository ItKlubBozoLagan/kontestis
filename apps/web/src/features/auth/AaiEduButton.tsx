import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { authQueries } from "@/api/auth";
import { Button } from "@/components/ui/button";

export const AaiEduButton = ({ purpose }: { purpose: "login" | "link" }) => {
    const { t } = useTranslation();
    const { data } = useQuery(authQueries.aaiEduUrl(purpose));

    return (
        <Button
            variant="outline"
            className="h-11 w-64 gap-2"
            disabled={!data}
            onClick={() => data && (window.location.href = data.url)}
        >
            <img src="/aai-edu.svg" alt="AAI@EduHr" className="h-5" />
            {purpose === "link" && <span className="font-semibold">{t("auth.aai.link")}</span>}
        </Button>
    );
};
