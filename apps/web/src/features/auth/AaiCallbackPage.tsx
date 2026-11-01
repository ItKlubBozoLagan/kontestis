import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Navigate, useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";

import { useAaiEduExchange } from "@/api/auth";
import { Spinner } from "@/components/common/Spinner";
import { useSessionStore } from "@/stores/session";

/**
 * AAI@EduHr redirect target. `state` is "login" for a fresh login and "link" when a logged in
 * user connects their AAI@EduHr identity from the account page.
 */
export const AaiCallbackPage = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [params] = useSearchParams();
    const exchange = useAaiEduExchange();
    const started = useRef(false);
    const hasSession = useSessionStore((state) => !!state.token);

    const code = params.get("code");
    const purpose = params.get("state");
    const valid = !!code && (purpose === "login" || purpose === "link");

    useEffect(() => {
        if (!valid || started.current) return;

        started.current = true;

        exchange.mutate(code, {
            onSuccess: () => navigate(purpose === "link" ? "/account" : "/", { replace: true }),
            onError: () => {
                toast.error(t("auth.aai.failed"));
                navigate(purpose === "link" ? "/account" : "/login", { replace: true });
            },
        });
    }, [valid, code, purpose, exchange, navigate, t]);

    if (!valid) return <Navigate to={hasSession ? "/account" : "/login"} replace />;

    return (
        <div className="flex flex-col items-center gap-3 py-20">
            <Spinner className="size-8" />
            <span className="text-muted-foreground">
                {purpose === "link" ? t("auth.aai.linking") : t("auth.aai.loggingIn")}
            </span>
        </div>
    );
};
