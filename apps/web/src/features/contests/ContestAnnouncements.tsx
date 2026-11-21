import type { Contest } from "@kontestis/models";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNowStrict } from "date-fns";
import { Megaphone } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { contestQueries } from "@/api/contests";
import { Section } from "@/components/common/Section";
import { Button } from "@/components/ui/button";
import { useDateLocale } from "@/hooks/useDateLocale";
import { snowflakeTime } from "@/lib/snowflake";
import { cn } from "@/lib/utils";

/** Long announcements are clamped until expanded so they never push the problems away. */
const CLAMP_AFTER = 220;
const VISIBLE = 2;

const Announcement = ({ message, at }: { message: string; at?: Date }) => {
    const { t } = useTranslation();
    const locale = useDateLocale();
    const long = message.length > CLAMP_AFTER || message.split("\n").length > 4;
    const [open, setOpen] = useState(false);

    return (
        <li className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 dark:border-amber-900 dark:bg-amber-950/50">
            <p
                className={cn(
                    "text-sm break-words whitespace-pre-line",
                    long && !open && "line-clamp-4"
                )}
            >
                {message}
            </p>
            <div className="text-muted-foreground mt-1 flex items-center justify-between gap-2 text-xs">
                {at ? (
                    <time dateTime={at.toISOString()}>
                        {formatDistanceToNowStrict(at, { addSuffix: true, locale })}
                    </time>
                ) : (
                    <span />
                )}
                {long && (
                    <button
                        type="button"
                        className="text-primary font-medium hover:underline"
                        aria-expanded={open}
                        onClick={() => setOpen((value) => !value)}
                    >
                        {open ? t("contests.announcements.less") : t("contests.announcements.more")}
                    </button>
                )}
            </div>
        </li>
    );
};

/** Contest announcements, newest first. Hidden entirely when there are none. */
export const ContestAnnouncements = ({
    contest,
    alwaysShow = false,
}: {
    contest: Contest;
    alwaysShow?: boolean;
}) => {
    const { t } = useTranslation();
    const [showAll, setShowAll] = useState(false);
    const { data: announcements = [] } = useQuery(contestQueries.announcements(contest.id));

    if (announcements.length === 0 && !alwaysShow) return null;

    const sorted = [...announcements].sort((a, b) => (b.id > a.id ? 1 : b.id < a.id ? -1 : 0));
    const visible = showAll ? sorted : sorted.slice(0, VISIBLE);

    return (
        <Section
            title={
                <>
                    {t("contests.announcements.title")}
                    {sorted.length > 0 && (
                        <span className="text-muted-foreground text-sm font-normal">
                            {sorted.length}
                        </span>
                    )}
                </>
            }
            icon={Megaphone}
            contentClassName="flex flex-col gap-2 p-3"
        >
            {sorted.length === 0 ? (
                <p className="text-muted-foreground py-2 text-center text-sm">
                    {t("contests.announcements.empty")}
                </p>
            ) : (
                <ul className="flex flex-col gap-2" aria-live="polite">
                    {visible.map((announcement) => (
                        <Announcement
                            key={announcement.id.toString()}
                            message={announcement.message}
                            at={snowflakeTime(announcement.id)}
                        />
                    ))}
                </ul>
            )}
            {sorted.length > VISIBLE && (
                <Button variant="ghost" size="sm" onClick={() => setShowAll((value) => !value)}>
                    {showAll
                        ? t("contests.announcements.showFewer")
                        : t("contests.announcements.showAll", { count: sorted.length })}
                </Button>
            )}
        </Section>
    );
};
