import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { Bell, ChevronDown, ChevronUp } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { notificationQueries } from "@/api/notifications";
import { Section } from "@/components/common/Section";
import { Button } from "@/components/ui/button";
import { useDateLocale } from "@/hooks/useDateLocale";
import { formatDateTime } from "@/lib/format";

/** Site-wide alerts; renders nothing when there are none. */
export const SiteAlerts = () => {
    const { t } = useTranslation();
    const locale = useDateLocale();
    const [expanded, setExpanded] = useState(false);
    const { data: notifications = [] } = useQuery(notificationQueries.all());

    const alerts = useMemo(
        () =>
            notifications
                .filter((it) => it.type === "alert")
                .sort((a, b) => b.created_at.getTime() - a.created_at.getTime()),
        [notifications]
    );

    if (alerts.length === 0) return null;

    return (
        <Section
            title={t("dashboard.alerts.title")}
            icon={Bell}
            contentClassName="flex flex-col gap-2"
        >
            {alerts.slice(0, expanded ? 8 : 2).map((alert) => (
                <div
                    key={alert.id.toString()}
                    className="bg-muted/50 flex flex-col gap-1 rounded-md border px-3 py-2"
                >
                    <time
                        className="text-muted-foreground text-xs"
                        dateTime={alert.created_at.toISOString()}
                        title={formatDateTime(alert.created_at)}
                    >
                        {formatDistanceToNow(alert.created_at, { addSuffix: true, locale })}
                    </time>
                    <span className="break-words whitespace-pre-line">{alert.data}</span>
                </div>
            ))}
            {alerts.length > 2 && (
                <Button
                    variant="ghost"
                    size="sm"
                    className="self-center"
                    aria-expanded={expanded}
                    onClick={() => setExpanded((it) => !it)}
                >
                    {expanded ? <ChevronUp /> : <ChevronDown />}
                    {expanded ? t("dashboard.alerts.collapse") : t("dashboard.alerts.older")}
                </Button>
            )}
        </Section>
    );
};
