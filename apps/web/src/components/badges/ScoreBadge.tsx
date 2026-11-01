import { cn } from "@/lib/utils";

const tone = (score: number, max: number) => {
    if (max <= 0) return "text-muted-foreground";

    const ratio = score / max;

    if (ratio <= 0) return "text-red-700 dark:text-red-400";

    if (ratio <= 0.25) return "text-red-600 dark:text-red-400";

    if (ratio <= 0.5) return "text-orange-700 dark:text-orange-400";

    if (ratio <= 0.75) return "text-yellow-600 dark:text-yellow-400";

    if (ratio < 1) return "text-lime-600 dark:text-lime-400";

    return "text-green-700 dark:text-green-400";
};

/** "score/max" colored from red (nothing) to green (full score). */
export const ScoreBadge = ({
    score,
    max,
    className,
    dimWhenUnattempted = false,
}: {
    score: number | null | undefined;
    max: number;
    className?: string;
    dimWhenUnattempted?: boolean;
}) => (
    <span
        className={cn(
            "font-mono text-sm font-semibold tabular-nums",
            score === null || score === undefined
                ? dimWhenUnattempted
                    ? "text-muted-foreground"
                    : tone(0, max)
                : tone(score, max),
            className
        )}
    >
        {score ?? (dimWhenUnattempted ? "–" : 0)}/{max}
    </span>
);
