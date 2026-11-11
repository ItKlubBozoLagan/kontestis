import type { Contest } from "@kontestis/models";
import { useTranslation } from "react-i18next";

import { useNow } from "@/hooks/useNow";
import { contestEnd, contestPhase } from "@/lib/contest";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

type Timed = Pick<Contest, "start_time" | "duration_seconds">;

const pad = (value: number) => value.toString().padStart(2, "0");

/** "2:31:05" style clock; days are split off so a week-long contest stays readable. */
export const formatClock = (millis: number) => {
    const total = Math.max(0, Math.floor(millis / 1000));
    const days = Math.floor(total / 86_400);
    const hours = Math.floor((total % 86_400) / 3600);
    const clock = `${hours}:${pad(Math.floor((total % 3600) / 60))}:${pad(total % 60)}`;

    return days > 0 ? `${days}d ${clock}` : clock;
};

const FIVE_MINUTES = 5 * 60_000;
const FIFTEEN_MINUTES = 15 * 60_000;

const useClock = (contest: Timed) => {
    const now = useNow();
    const phase = contestPhase(contest, now);
    const start = contest.start_time.getTime();
    const end = contestEnd(contest);
    const remaining = phase === "running" ? end - now : phase === "upcoming" ? start - now : 0;

    const tone =
        phase !== "running"
            ? "text-foreground"
            : remaining <= FIVE_MINUTES
            ? "text-red-600 dark:text-red-400"
            : remaining <= FIFTEEN_MINUTES
            ? "text-amber-600 dark:text-amber-400"
            : "text-foreground";

    return {
        phase,
        remaining,
        tone,
        end,
        progress:
            phase === "running" ? (now - start) / (end - start) : phase === "finished" ? 1 : 0,
    };
};

/**
 * The contest countdown. During a contest this is the single most important number on the
 * page, so it is large, always visible and changes colour in the last 15 and 5 minutes.
 */
export const ContestClock = ({ contest, className }: { contest: Timed; className?: string }) => {
    const { t } = useTranslation();
    const { phase, remaining, tone, end, progress } = useClock(contest);

    return (
        <div className={cn("bg-card flex flex-col gap-2 rounded-md border p-4", className)}>
            <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground flex items-center gap-2 text-sm font-medium">
                    {phase === "running" && (
                        <span className="size-2 animate-pulse rounded-full bg-green-500" />
                    )}
                    {t(`contests.clock.${phase}`)}
                </span>
                <span className="text-muted-foreground text-xs">
                    {phase === "upcoming"
                        ? t("contests.clock.startsAt", {
                              time: formatDateTime(contest.start_time),
                          })
                        : t(
                              phase === "running"
                                  ? "contests.clock.endsAt"
                                  : "contests.clock.endedAt",
                              {
                                  time: formatDateTime(new Date(end)),
                              }
                          )}
                </span>
            </div>
            {phase === "finished" ? (
                <span className="text-2xl font-medium">{t("phases.finished")}</span>
            ) : (
                <span
                    role="timer"
                    className={cn(
                        "font-mono text-4xl leading-none font-semibold tabular-nums sm:text-5xl",
                        tone
                    )}
                >
                    {formatClock(remaining)}
                </span>
            )}
            {phase === "running" && (
                <div
                    className="bg-muted h-1.5 w-full overflow-hidden rounded-full"
                    role="progressbar"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={Math.round(progress * 100)}
                    aria-label={t("contests.clock.elapsed")}
                >
                    <div
                        className="bg-primary h-full rounded-full transition-[width] duration-1000 ease-linear"
                        style={{ width: `${Math.min(100, progress * 100)}%` }}
                    />
                </div>
            )}
        </div>
    );
};

/** One-line countdown for sticky bars. Renders nothing once the contest is over. */
export const ContestClockInline = ({
    contest,
    className,
}: {
    contest: Timed;
    className?: string;
}) => {
    const { t } = useTranslation();
    const { phase, remaining, tone } = useClock(contest);

    if (phase === "finished")
        return (
            <span className={cn("text-muted-foreground text-sm", className)}>
                {t("phases.finished")}
            </span>
        );

    return (
        <span className={cn("flex items-baseline gap-2", className)}>
            <span className="text-muted-foreground hidden text-xs sm:inline">
                {t(`contests.clock.${phase}`)}
            </span>
            <span role="timer" className={cn("font-mono text-lg font-semibold tabular-nums", tone)}>
                {formatClock(remaining)}
            </span>
        </span>
    );
};
