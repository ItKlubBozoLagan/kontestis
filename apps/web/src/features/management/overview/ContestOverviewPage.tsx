import type { Contest } from "@kontestis/models";
import { memo } from "react";

import { ControlRoom } from "@/features/management/overview/ControlRoom";
import { FinishedOverview, UpcomingOverview } from "@/features/management/overview/PhaseOverviews";
import { useManagedContest } from "@/features/management/useManagedContest";
import { useNow } from "@/hooks/useNow";
import { type ContestPhase, contestPhase } from "@/lib/contest";

/** Memoised so the per-second clock tick only re-renders the page when the phase changes. */
const PhaseOverview = memo(({ contest, phase }: { contest: Contest; phase: ContestPhase }) => {
    if (phase === "upcoming") return <UpcomingOverview contest={contest} />;

    if (phase === "running") return <ControlRoom contest={contest} />;

    return <FinishedOverview contest={contest} />;
});

PhaseOverview.displayName = "PhaseOverview";

/** Organiser overview that adapts to the contest phase. */
export const ContestOverviewPage = () => {
    const contest = useManagedContest();
    const phase = contestPhase(contest, useNow());

    return <PhaseOverview contest={contest} phase={phase} />;
};
