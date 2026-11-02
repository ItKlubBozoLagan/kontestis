import { AlertTriangle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

import { HttpError } from "@/api/http";
import { Button } from "@/components/ui/button";

type Props = {
    error: unknown;
    onRetry?: () => void;
};

export const ErrorView = ({ error, onRetry }: Props) => {
    const { t } = useTranslation();
    const status = error instanceof HttpError ? error.status : undefined;

    const title =
        status === 404
            ? t("errors.notFound")
            : status === 403
            ? t("errors.forbidden")
            : t("errors.pageCrashed");

    return (
        <div className="flex w-full flex-col items-center gap-3 rounded-md border border-dashed py-16 text-center">
            <AlertTriangle className="text-destructive size-8" />
            <p className="text-lg font-medium">{title}</p>
            {error instanceof Error && status !== 404 && (
                <p className="text-muted-foreground max-w-md font-mono text-xs">{error.message}</p>
            )}
            <div className="flex gap-2">
                {onRetry && (
                    <Button variant="outline" onClick={onRetry}>
                        {t("errors.retry")}
                    </Button>
                )}
                <Button variant="secondary" asChild>
                    <Link to="/">{t("errors.goHome")}</Link>
                </Button>
            </div>
        </div>
    );
};
