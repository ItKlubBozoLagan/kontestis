import type { Contest } from "@kontestis/models";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { useNow } from "@/hooks/useNow";
import { contestEnd, contestPhase } from "@/lib/contest";
import { formatDuration } from "@/lib/format";
import { cn } from "@/lib/utils";

const phaseStyles = {
    upcoming:
        "border-yellow-300 bg-yellow-50 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200 dark:border-yellow-800",
    running:
        "border-green-300 bg-green-50 text-green-800 dark:bg-green-950 dark:text-green-200 dark:border-green-800",
    finished:
        "border-red-200 bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300 dark:border-red-900",
};

/** Live phase of a contest with a countdown ("Starts in 2h 3m", "Ends in 12m 3s", "Finished"). */
export const ContestPhaseBadge = ({
    contest,
    className,
    showCountdown = true,
}: {
    contest: Pick<Contest, "start_time" | "duration_seconds">;
    className?: string;
    showCountdown?: boolean;
}) => {
    const { t } = useTranslation();
    const now = useNow();
    const phase = contestPhase(contest, now);

    const label =
        !showCountdown || phase === "finished"
            ? t(`phases.${phase}`)
            : phase === "upcoming"
            ? t("phases.startsIn", { time: formatDuration(contest.start_time.getTime() - now) })
            : t("phases.endsIn", { time: formatDuration(contestEnd(contest) - now) });

    return (
        <Badge
            variant="outline"
            className={cn("font-mono tabular-nums", phaseStyles[phase], className)}
        >
            {phase === "running" && (
                <span className="size-1.5 animate-pulse rounded-full bg-green-500" />
            )}
            {label}
        </Badge>
    );
};
