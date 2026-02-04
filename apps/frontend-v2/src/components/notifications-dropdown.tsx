import { SiteNotification, SiteNotificationType } from "@kontestis/models";
import { format } from "date-fns";
import {
    AlertCircle,
    AlertOctagon,
    Bell,
    ChevronDown,
    ChevronUp,
    Clock,
    HelpCircle,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { useNotifications, useReadNotifications } from "@/api/notifications";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useTranslation } from "@/i18n";
import { cn } from "@/lib/utils";

const NotificationTypeIconMap: Record<SiteNotificationType, typeof Clock> = {
    "contest-start": Clock,
    "contest-end": Clock,
    "new-question": HelpCircle,
    "new-announcement": AlertCircle,
    "question-answer": HelpCircle,
    alert: AlertOctagon,
};

export function NotificationsDropdown() {
    const { t } = useTranslation();
    const { data: notifications } = useNotifications();
    const { mutate: markAsRead, isPending: isMarking } = useReadNotifications();

    const [open, setOpen] = useState(false);
    const [listExpanded, setListExpanded] = useState(false);
    const readTimeoutReference = useRef<ReturnType<typeof setTimeout>>();

    const sortedNotifications = useMemo(
        () =>
            [...(notifications ?? [])].sort(
                (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            ),
        [notifications]
    );

    const unreadNotificationIds = useMemo(
        () => sortedNotifications.filter((n) => !n.seen).map((n) => n.id.toString()),
        [sortedNotifications]
    );

    const hasUnread = unreadNotificationIds.length > 0;

    // Mark notifications as read after being open for 1 second
    useEffect(() => {
        if (isMarking) return;

        if (!open) {
            if (readTimeoutReference.current) {
                clearTimeout(readTimeoutReference.current);
            }

            return;
        }

        if (unreadNotificationIds.length === 0) return;

        readTimeoutReference.current = setTimeout(() => {
            markAsRead({ notificationIds: unreadNotificationIds });
        }, 1000);

        return () => {
            if (readTimeoutReference.current) {
                clearTimeout(readTimeoutReference.current);
            }
        };
    }, [open, unreadNotificationIds, isMarking, markAsRead]);

    // Reset expanded state when closing
    useEffect(() => {
        if (!open) {
            setListExpanded(false);
        }
    }, [open]);

    const displayedNotifications = listExpanded
        ? sortedNotifications.slice(0, 8)
        : sortedNotifications.slice(0, 4);

    const formatNotificationMessage = (notification: SiteNotification) => {
        const translationKey = `notifications.${notification.type}` as const;
        const template = t(translationKey);

        // Replace %1 with the notification data
        return template.replace("%1", notification.data);
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {hasUnread && (
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500" />
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
                {sortedNotifications.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground">
                        {t("navbar.alerts.noContentMessage")}
                    </div>
                ) : (
                    <div className="flex flex-col">
                        {displayedNotifications.map((notification, index) => {
                            const Icon = NotificationTypeIconMap[notification.type];
                            const isUnread = !notification.seen;

                            return (
                                <div
                                    key={notification.id.toString()}
                                    className={cn(
                                        "py-2 px-3 flex flex-col gap-1",
                                        index % 2 === 0 ? "bg-background" : "bg-muted/30"
                                    )}
                                >
                                    <div
                                        className={cn(
                                            "flex items-center gap-2 text-xs text-muted-foreground",
                                            isUnread && "font-bold"
                                        )}
                                    >
                                        <Icon className="h-4 w-4" />
                                        {format(
                                            new Date(notification.created_at),
                                            "dd.MM.yyyy. HH:mm"
                                        )}
                                    </div>
                                    <div className="text-sm">
                                        {notification.type === "alert" && (
                                            <span className="inline-block px-1.5 py-0.5 mb-1 text-xs font-medium rounded bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
                                                {t("navbar.alerts.breadcrumbs.official")}
                                            </span>
                                        )}
                                        <div>
                                            {isUnread && <span className="text-primary">* </span>}
                                            {notification.type === "alert" ? (
                                                notification.data
                                            ) : (
                                                <span
                                                    dangerouslySetInnerHTML={{
                                                        __html: formatNotificationMessage(
                                                            notification
                                                        ).replace(
                                                            notification.data,
                                                            `<strong>${notification.data}</strong>`
                                                        ),
                                                    }}
                                                />
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        {sortedNotifications.length > 4 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="w-full rounded-none border-t"
                                onClick={() => setListExpanded(!listExpanded)}
                            >
                                {listExpanded ? (
                                    <>
                                        <ChevronUp className="h-4 w-4 mr-2" />
                                        {t("navbar.alerts.overflow.collapse")}
                                    </>
                                ) : (
                                    <>
                                        <ChevronDown className="h-4 w-4 mr-2" />
                                        {t("navbar.alerts.overflow.expand")}
                                    </>
                                )}
                            </Button>
                        )}
                    </div>
                )}
            </PopoverContent>
        </Popover>
    );
}
