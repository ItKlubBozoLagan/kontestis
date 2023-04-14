import { SiteNotification, SiteNotificationType } from "@kontestis/models";
import { toCroatianLocale } from "@kontestis/utils";
import { FC, useEffect, useMemo, useRef, useState } from "react";
import { IconType } from "react-icons";
import {
    AiFillCaretDown,
    AiFillCaretUp,
    FiAlertCircle,
    FiAlertOctagon,
    FiBell,
    FiClock,
    FiHelpCircle,
} from "react-icons/all";
import tw, { theme } from "twin.macro";

import { useReadNotifications } from "../hooks/notifications/useReadNotifications";
import { useDocumentEvent } from "../hooks/useDocumentEvent";
import { useTranslation } from "../hooks/useTranslation";
import { R } from "../util/remeda";
import { Breadcrumb } from "./Breadcrumb";
import { Translated } from "./Translated";

type Properties = {
    notifications: SiteNotification[];
};

const NotificationTypeIconMap: Record<SiteNotificationType, IconType> = {
    "contest-start": FiClock,
    "contest-end": FiClock,
    "new-question": FiHelpCircle,
    "new-announcement": FiAlertCircle,
    "question-answer": FiHelpCircle,
    alert: FiAlertOctagon,
};

export const NotificationBellDropdown: FC<Properties> = ({ notifications }) => {
    const expandedReference = useRef<HTMLDivElement | null>(null);

    const [expanded, setExpanded] = useState(false);
    const [listExpanded, setListExpanded] = useState(false);
    const [readTimeout, setReadTimeout] = useState<ReturnType<typeof setTimeout>>();

    const newNotificationIds = useMemo(
        () => notifications.filter((it) => !it.seen).map((it) => it.id),
        [notifications]
    );

    const sortedNotifications = useMemo(
        () => R.sortBy(notifications, [(it) => it.created_at, "desc"]),
        [notifications]
    );

    const { mutate, isLoading } = useReadNotifications();

    useEffect(() => {
        if (isLoading) return;

        if (!expanded) {
            if (readTimeout) clearTimeout(readTimeout);

            return;
        }

        setReadTimeout(
            setTimeout(() => {
                mutate({ notificationIds: newNotificationIds.map((it) => it.toString()) });
            }, 1000)
        );
    }, [expanded]);

    useDocumentEvent("click", (event) => {
        const { current } = expandedReference;

        if (!current || !(event.target instanceof HTMLElement)) return;

        if (current.contains(event.target)) return;

        setExpanded(false);
    });

    useEffect(() => {
        if (expanded) return;

        setListExpanded(false);
    }, [expanded]);

    const { t } = useTranslation();

    return (
        <div>
            <div tw={"flex items-center text-neutral-600 cursor-pointer relative"}>
                <FiBell size={"18px"} onClick={() => setExpanded((previous) => !previous)} />
                {newNotificationIds.length > 0 && (
                    <div tw={"absolute -top-0.5 right-0.5 w-2 h-2 rounded-full bg-red-400"}></div>
                )}
            </div>
            {expanded && (
                <div
                    ref={expandedReference}
                    tw={
                        "absolute z-10 top-14 w-[300px] bg-neutral-100 border-2 border-solid border-neutral-300 flex flex-col"
                    }
                    style={{
                        transform: "translateX(-10%)",
                    }}
                >
                    {notifications.length === 0 ? (
                        <span tw={"p-4 text-center"}>{t("navbar.alerts.noContentMessage")}</span>
                    ) : (
                        <>
                            {sortedNotifications
                                .slice(0, listExpanded ? 8 : 4)
                                .map((it, index, _, Icon = NotificationTypeIconMap[it.type]) => (
                                    <div
                                        key={it.id.toString()}
                                        tw={"py-2 px-3 flex flex-col gap-1"}
                                        css={
                                            index % 2 === 0
                                                ? tw`bg-neutral-100`
                                                : tw`bg-neutral-200`
                                        }
                                    >
                                        <div
                                            tw={
                                                "w-full text-right text-neutral-600 text-sm flex items-center gap-2 select-none"
                                            }
                                            css={
                                                newNotificationIds.includes(it.id)
                                                    ? tw`font-bold`
                                                    : ""
                                            }
                                        >
                                            <Icon size={"16px"} />
                                            {toCroatianLocale(it.created_at)}
                                        </div>
                                        <div
                                            css={
                                                it.type === "alert"
                                                    ? tw`flex flex-col gap-1 mt-1`
                                                    : ""
                                            }
                                        >
                                            {it.type === "alert" && (
                                                <Breadcrumb color={theme`colors.red.300`}>
                                                    {t("navbar.alerts.breadcrumbs.official")}
                                                </Breadcrumb>
                                            )}
                                            <div>
                                                {newNotificationIds.includes(it.id) && (
                                                    <span>* </span>
                                                )}
                                                <Translated
                                                    translationKey={`notifications.${it.type}`}
                                                >
                                                    <span
                                                        css={
                                                            it.type !== "alert" ? tw`font-bold` : ""
                                                        }
                                                    >
                                                        {it.data + " "}
                                                    </span>
                                                </Translated>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            {sortedNotifications.length > 4 && (
                                <div
                                    tw={
                                        "w-full p-2 flex justify-center items-center gap-2 cursor-pointer bg-neutral-300 bg-opacity-80"
                                    }
                                    onClick={() => setListExpanded((previous) => !previous)}
                                >
                                    {listExpanded ? (
                                        <>
                                            <AiFillCaretUp />
                                            {t("navbar.alerts.overflow.collapse")}
                                        </>
                                    ) : (
                                        <>
                                            <AiFillCaretDown />
                                            {t("navbar.alerts.overflow.expand")}
                                        </>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
};
