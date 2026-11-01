import { AdminPermissions } from "@kontestis/models";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { Megaphone, ShieldAlert } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { useCurrentUser } from "@/api/auth";
import { notificationQueries, useCreateAlert } from "@/api/notifications";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { EmptyState } from "@/components/common/EmptyState";
import { Section } from "@/components/common/Section";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useDateLocale } from "@/hooks/useDateLocale";
import { formatDateTime } from "@/lib/format";
import { isAdmin } from "@/lib/permissions";

export const AdminAlertsPage = () => {
    const { t } = useTranslation();
    const locale = useDateLocale();
    const user = useCurrentUser();
    const [message, setMessage] = useState("");
    const createAlert = useCreateAlert();
    const { data: notifications } = useQuery(notificationQueries.all());

    const alerts = useMemo(
        () =>
            (notifications ?? [])
                .filter((it) => it.type === "alert")
                .sort((a, b) => b.created_at.getTime() - a.created_at.getTime()),
        [notifications]
    );

    return (
        <div className="grid w-full grid-cols-1 gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
            {isAdmin(user, AdminPermissions.ADD_ALERTS) && (
                <Section title={t("admin.alerts.create")} icon={Megaphone} className="h-fit">
                    <div className="flex flex-col gap-3">
                        <Label htmlFor="alert-message">{t("admin.alerts.message")}</Label>
                        <Textarea
                            id="alert-message"
                            value={message}
                            onChange={(event) => setMessage(event.target.value)}
                            placeholder={t("admin.alerts.placeholder")}
                            className="min-h-32"
                        />
                        <ConfirmDialog
                            trigger={
                                <Button
                                    disabled={!message.trim() || createAlert.isPending}
                                    className="self-end"
                                >
                                    <Megaphone />
                                    {t("admin.alerts.push")}
                                </Button>
                            }
                            title={t("admin.alerts.confirmTitle")}
                            description={t("admin.alerts.confirmDescription")}
                            confirmLabel={t("admin.alerts.push")}
                            destructive={false}
                            onConfirm={() =>
                                createAlert.mutateAsync(message.trim(), {
                                    onSuccess: () => {
                                        setMessage("");
                                        toast.success(t("admin.alerts.pushed"));
                                    },
                                })
                            }
                        />
                    </div>
                </Section>
            )}
            <Section title={t("admin.alerts.recent")} icon={ShieldAlert} className="h-fit">
                {!notifications ? (
                    <Skeleton className="h-32 w-full" />
                ) : alerts.length === 0 ? (
                    <EmptyState title={t("admin.alerts.empty")} />
                ) : (
                    <ul className="flex flex-col gap-3">
                        {alerts.map((alert) => (
                            <li
                                key={alert.id.toString()}
                                className="bg-muted/40 flex flex-col gap-1 rounded-md border p-3"
                            >
                                <time
                                    className="text-muted-foreground text-xs"
                                    title={formatDateTime(alert.created_at)}
                                >
                                    {formatDistanceToNow(alert.created_at, {
                                        addSuffix: true,
                                        locale,
                                    })}
                                </time>
                                <p className="text-sm whitespace-pre-line">{alert.data}</p>
                            </li>
                        ))}
                    </ul>
                )}
            </Section>
        </div>
    );
};
