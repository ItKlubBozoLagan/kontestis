import { ContestMemberPermissions } from "@kontestis/models";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNowStrict } from "date-fns";
import { Megaphone, Send } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { toast } from "sonner";

import { contestQueries, useCreateAnnouncement } from "@/api/contests";
import { Section } from "@/components/common/Section";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useContestAccess } from "@/hooks/useContestAccess";
import { useDateLocale } from "@/hooks/useDateLocale";
import { snowflakeTime } from "@/lib/snowflake";
import { cn } from "@/lib/utils";

const SHOWN = 3;

const Composer = ({ contestId }: { contestId: bigint }) => {
    const { t } = useTranslation();
    const create = useCreateAnnouncement(contestId);
    const [message, setMessage] = useState("");

    return (
        <form
            className="flex flex-col gap-2"
            onSubmit={(event) => {
                event.preventDefault();

                if (!message.trim()) return;

                create.mutate(message.trim(), {
                    onSuccess: () => {
                        setMessage("");
                        toast.success(t("management.overview.control.announce.published"));
                    },
                });
            }}
        >
            <Textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder={t("management.announcements.placeholder")}
                className="min-h-24"
            />
            <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground text-xs">
                    {t("management.announcements.hint")}
                </span>
                <Button type="submit" size="sm" disabled={create.isPending || !message.trim()}>
                    <Send />
                    {t("management.overview.control.announce.publish")}
                </Button>
            </div>
        </form>
    );
};

const RecentAnnouncements = ({ contestId }: { contestId: bigint }) => {
    const { t } = useTranslation();
    const locale = useDateLocale();
    const { data: announcements } = useQuery(contestQueries.announcements(contestId));

    if (!announcements) return null;

    const recent = [...announcements]
        .sort((a, b) => (b.id > a.id ? 1 : b.id < a.id ? -1 : 0))
        .slice(0, SHOWN);

    return (
        <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
                <h3 className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                    {t("management.overview.control.announce.recent")}
                </h3>
                <Link
                    to={`/management/${contestId}/announcements`}
                    className="text-primary text-xs hover:underline"
                >
                    {t("management.overview.control.announce.all")}
                </Link>
            </div>
            {recent.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                    {t("management.announcements.empty")}
                </p>
            ) : (
                <ul className="flex flex-col gap-2">
                    {recent.map((announcement) => {
                        const at = snowflakeTime(announcement.id);

                        return (
                            <li
                                key={announcement.id.toString()}
                                className="bg-muted/40 rounded-md border px-3 py-2"
                            >
                                <p className="line-clamp-3 text-sm break-words whitespace-pre-line">
                                    {announcement.message}
                                </p>
                                <time
                                    dateTime={at.toISOString()}
                                    className="text-muted-foreground text-xs"
                                >
                                    {formatDistanceToNowStrict(at, { addSuffix: true, locale })}
                                </time>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
};

/** Quick announcement form with the latest few announcements under it. */
export const AnnouncementComposer = ({
    contestId,
    className,
}: {
    contestId: bigint;
    className?: string;
}) => {
    const { t } = useTranslation();
    const { can } = useContestAccess({ id: contestId });

    return (
        <Section
            title={t("management.overview.control.announce.title")}
            icon={Megaphone}
            className={cn("h-fit", className)}
            contentClassName="flex flex-col gap-4"
        >
            {can(ContestMemberPermissions.CREATE_ANNOUNCEMENT) && (
                <Composer contestId={contestId} />
            )}
            <RecentAnnouncements contestId={contestId} />
        </Section>
    );
};
