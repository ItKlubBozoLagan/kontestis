import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { useCurrentUser } from "@/api/auth";
import { contestQueries } from "@/api/contests";
import { PageHeader } from "@/components/common/PageHeader";
import { JoinContestDialog } from "@/components/contest/JoinContestDialog";
import { ActivitySection } from "@/features/dashboard/ActivitySection";
import { LiveContests } from "@/features/dashboard/LiveContests";
import { NextContests } from "@/features/dashboard/NextContests";
import { PracticeSection } from "@/features/dashboard/PracticeSection";
import { SiteAlerts } from "@/features/dashboard/SiteAlerts";
import { compareContests, contestPhase } from "@/lib/contest";

const useSplitContests = () => {
    const { data: contests } = useSuspenseQuery(contestQueries.all());

    return useMemo(() => {
        const active = contests
            .filter((contest) => contestPhase(contest) !== "finished")
            .sort((a, b) => compareContests(a, b));

        const isLive = (contest: (typeof active)[number]) =>
            contest.registered && contestPhase(contest) === "running";

        return {
            live: active.filter((contest) => isLive(contest)),
            next: active.filter((contest) => !isLive(contest)).slice(0, 6),
        };
    }, [contests]);
};

/** "What's next" home: the live contest first, then what to join, alerts, practice, activity. */
export const DashboardPage = () => {
    const { t } = useTranslation();
    const user = useCurrentUser();
    const { live, next } = useSplitContests();
    const firstName = user.full_name.split(" ")[0] ?? user.full_name;

    return (
        <div className="flex flex-col gap-6">
            <PageHeader
                title={t("dashboard.welcome", { name: firstName })}
                actions={<JoinContestDialog variant="outline" />}
            />
            <LiveContests contests={live} />
            {(next.length > 0 || live.length === 0) && <NextContests contests={next} />}
            <SiteAlerts />
            <PracticeSection />
            <ActivitySection />
        </div>
    );
};
