import type { Contest } from "@kontestis/models";
import { useQuery } from "@tanstack/react-query";
import { Megaphone } from "lucide-react";
import { useTranslation } from "react-i18next";

import { contestQueries } from "@/api/contests";
import { Section } from "@/components/common/Section";

/** Contest announcements, newest first. Hidden entirely when there are none. */
export const ContestAnnouncements = ({
    contest,
    alwaysShow = false,
}: {
    contest: Contest;
    alwaysShow?: boolean;
}) => {
    const { t } = useTranslation();
    const { data: announcements = [] } = useQuery(contestQueries.announcements(contest.id));

    if (announcements.length === 0 && !alwaysShow) return null;

    const sorted = [...announcements].sort((a, b) => (b.id > a.id ? 1 : b.id < a.id ? -1 : 0));

    return (
        <Section
            title={t("contests.announcements.title")}
            icon={Megaphone}
            contentClassName="flex flex-col gap-2"
        >
            {sorted.length === 0 ? (
                <p className="text-muted-foreground text-center text-sm">
                    {t("contests.announcements.empty")}
                </p>
            ) : (
                sorted.map((announcement) => (
                    <div
                        key={announcement.id.toString()}
                        className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 font-mono text-sm whitespace-pre-line dark:border-amber-900 dark:bg-amber-950/50"
                    >
                        {announcement.message}
                    </div>
                ))
            )}
        </Section>
    );
};
