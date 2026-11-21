import type { SiteNotificationType } from "@kontestis/models";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { AlertCircle, Bell, Clock, HelpCircle, Megaphone, ShieldAlert } from "lucide-react";
import { type ComponentType, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { notificationQueries, useMarkNotificationsRead } from "@/api/notifications";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useDateLocale } from "@/hooks/useDateLocale";
import { cn } from "@/lib/utils";

const icons: Record<SiteNotificationType, ComponentType<{ className?: string }>> = {
    "contest-start": Clock,
    "contest-end": Clock,
    "new-question": HelpCircle,
    "question-answer": HelpCircle,
    "new-announcement": Megaphone,
    alert: ShieldAlert,
};

export const NotificationBell = () => {
    const { t } = useTranslation();
    const locale = useDateLocale();
    const [open, setOpen] = useState(false);
    const { data: notifications = [] } = useQuery(notificationQueries.all());
    const { mutate: markRead } = useMarkNotificationsRead();

    const unread = useMemo(() => notifications.filter((it) => !it.seen), [notifications]);

    // mark as read shortly after the list has been opened (and actually seen)
    useEffect(() => {
        if (!open || unread.length === 0) return;

        const timeout = setTimeout(() => markRead(unread.map((it) => it.id)), 1500);

        return () => clearTimeout(timeout);
    }, [open, unread, markRead]);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="relative"
                    aria-label={t("nav.notifications.label")}
                >
                    <Bell />
                    {unread.length > 0 && (
                        <span className="bg-destructive absolute top-1.5 right-1.5 size-2 rounded-full" />
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 p-0">
                <div className="flex items-center justify-between border-b px-3 py-2">
                    <span className="text-sm font-medium">{t("nav.notifications.label")}</span>
                    {unread.length > 0 && <Badge variant="secondary">{unread.length}</Badge>}
                </div>
                {notifications.length === 0 ? (
                    <p className="text-muted-foreground flex items-center justify-center gap-2 p-6 text-sm">
                        <AlertCircle className="size-4" />
                        {t("nav.notifications.empty")}
                    </p>
                ) : (
                    <ScrollArea className="max-h-96">
                        <ul className="divide-y">
                            {notifications.map((notification) => {
                                const Icon = icons[notification.type];

                                return (
                                    <li
                                        key={notification.id.toString()}
                                        className={cn(
                                            "flex gap-3 px-3 py-2.5",
                                            !notification.seen && "bg-accent/60"
                                        )}
                                    >
                                        <Icon className="text-muted-foreground mt-0.5 size-4 shrink-0" />
                                        <div className="flex min-w-0 flex-col gap-1">
                                            {notification.type === "alert" && (
                                                <Badge variant="destructive" className="w-fit">
                                                    {t("nav.notifications.official")}
                                                </Badge>
                                            )}
                                            <span
                                                className={cn(
                                                    "text-sm break-words",
                                                    !notification.seen && "font-medium"
                                                )}
                                            >
                                                {t(`nav.notifications.types.${notification.type}`, {
                                                    data: notification.data,
                                                })}
                                            </span>
                                            <time className="text-muted-foreground text-xs">
                                                {formatDistanceToNow(notification.created_at, {
                                                    addSuffix: true,
                                                    locale,
                                                })}
                                            </time>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    </ScrollArea>
                )}
            </PopoverContent>
        </Popover>
    );
};
