import { ContestMemberPermissions } from "@kontestis/models";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Megaphone, Send } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { contestQueries, useCreateAnnouncement } from "@/api/contests";
import { EmptyState } from "@/components/common/EmptyState";
import { Section } from "@/components/common/Section";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { snowflakeDate } from "@/features/management/shared/snowflake";
import { useManagedContest } from "@/features/management/useManagedContest";
import { useContestAccess } from "@/hooks/useContestAccess";
import { formatDateTime } from "@/lib/format";

export const AnnouncementsPage = () => {
    const { t } = useTranslation();
    const contest = useManagedContest();
    const { can } = useContestAccess(contest);
    const { data: announcements } = useSuspenseQuery(contestQueries.announcements(contest.id));
    const create = useCreateAnnouncement(contest.id);
    const [message, setMessage] = useState("");

    const sorted = [...announcements].sort((a, b) => (b.id > a.id ? 1 : b.id < a.id ? -1 : 0));

    return (
        <div className="grid gap-6 lg:grid-cols-[2fr_3fr]">
            {can(ContestMemberPermissions.CREATE_ANNOUNCEMENT) && (
                <Section
                    title={t("management.announcements.new")}
                    icon={Megaphone}
                    className="h-fit"
                >
                    <form
                        className="flex flex-col gap-3"
                        onSubmit={(event) => {
                            event.preventDefault();

                            if (!message.trim()) return;

                            create.mutate(message.trim(), {
                                onSuccess: () => {
                                    setMessage("");
                                    toast.success(t("management.announcements.sent"));
                                },
                            });
                        }}
                    >
                        <Textarea
                            value={message}
                            onChange={(event) => setMessage(event.target.value)}
                            placeholder={t("management.announcements.placeholder")}
                            className="min-h-32"
                        />
                        <div className="flex items-center justify-between gap-2">
                            <span className="text-muted-foreground text-xs">
                                {t("management.announcements.hint")}
                            </span>
                            <Button type="submit" disabled={create.isPending || !message.trim()}>
                                <Send />
                                {t("management.announcements.send")}
                            </Button>
                        </div>
                    </form>
                </Section>
            )}
            <Section title={t("management.announcements.title")} className="h-fit">
                {sorted.length === 0 ? (
                    <EmptyState title={t("management.announcements.empty")} icon={Megaphone} />
                ) : (
                    <ul className="flex flex-col gap-3">
                        {sorted.map((announcement) => (
                            <li
                                key={announcement.id.toString()}
                                className="bg-muted/40 rounded-md border p-3"
                            >
                                <time className="text-muted-foreground text-xs">
                                    {formatDateTime(snowflakeDate(announcement.id))}
                                </time>
                                <p className="mt-1 text-sm whitespace-pre-line">
                                    {announcement.message}
                                </p>
                            </li>
                        ))}
                    </ul>
                )}
            </Section>
        </div>
    );
};
