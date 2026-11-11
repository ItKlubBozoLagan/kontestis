import type { ContestWithPermissions } from "@kontestis/models";
import { CalendarClock, CheckCircle2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

import { EmptyState } from "@/components/common/EmptyState";
import { Section } from "@/components/common/Section";
import { ContestPhaseBadge } from "@/components/contest/ContestPhaseBadge";
import { JoinContestDialog } from "@/components/contest/JoinContestDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RegisterButton } from "@/features/contests/RegisterButton";
import { contestPhase } from "@/lib/contest";
import { formatDateTime } from "@/lib/format";

const ContestRow = ({ contest }: { contest: ContestWithPermissions }) => {
    const { t } = useTranslation();
    const running = contestPhase(contest) === "running";

    return (
        <li className="hover:bg-muted/60 focus-within:bg-muted/60 relative flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3 transition-colors">
            <div className="flex min-w-0 flex-col gap-0.5">
                <Link
                    to={`/contest/${contest.id}`}
                    className="focus-visible:ring-ring truncate rounded-sm font-medium outline-none after:absolute after:inset-0 focus-visible:ring-2"
                >
                    {contest.name}
                </Link>
                <span className="text-muted-foreground text-xs">
                    {running
                        ? t("dashboard.next.endsAt", {
                              time: formatDateTime(
                                  new Date(
                                      contest.start_time.getTime() + contest.duration_seconds * 1000
                                  )
                              ),
                          })
                        : t("dashboard.next.startsAt", {
                              time: formatDateTime(contest.start_time),
                          })}
                </span>
            </div>
            <div className="relative z-10 flex items-center gap-2">
                <ContestPhaseBadge contest={contest} />
                {contest.registered ? (
                    <Badge
                        variant="outline"
                        className="gap-1 border-green-300 text-green-700 dark:border-green-800 dark:text-green-400"
                    >
                        <CheckCircle2 className="size-3" />
                        {t("dashboard.next.registered")}
                    </Badge>
                ) : (
                    <RegisterButton contest={contest} />
                )}
            </div>
        </li>
    );
};

/** Running (not registered) and upcoming contests, or an empty state with next steps. */
export const NextContests = ({ contests }: { contests: ContestWithPermissions[] }) => {
    const { t } = useTranslation();

    return (
        <Section
            title={t("dashboard.next.title")}
            icon={CalendarClock}
            actions={
                contests.length > 0 && (
                    <Button variant="ghost" size="sm" asChild>
                        <Link to="/contests">{t("dashboard.next.all")}</Link>
                    </Button>
                )
            }
            contentClassName="p-0"
        >
            {contests.length === 0 ? (
                <EmptyState
                    title={t("dashboard.next.emptyTitle")}
                    description={t("dashboard.next.emptyHint")}
                    className="py-8"
                    action={
                        <div className="flex flex-wrap justify-center gap-2">
                            <Button variant="outline" asChild>
                                <Link to="/contests">{t("dashboard.next.all")}</Link>
                            </Button>
                            <JoinContestDialog variant="outline" />
                        </div>
                    }
                />
            ) : (
                <ul className="divide-y">
                    {contests.map((contest) => (
                        <ContestRow key={contest.id.toString()} contest={contest} />
                    ))}
                </ul>
            )}
        </Section>
    );
};
