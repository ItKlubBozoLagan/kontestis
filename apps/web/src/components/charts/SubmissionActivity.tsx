import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { statsQueries } from "@/api/stats";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

const levels = [
    "bg-neutral-200 dark:bg-neutral-800",
    "bg-blue-300 dark:bg-blue-900",
    "bg-blue-400 dark:bg-blue-700",
    "bg-blue-600 dark:bg-blue-500",
    "bg-blue-800 dark:bg-blue-300",
];

const levelFor = (value: number, max: number) => {
    if (value <= 0) return 0;

    return Math.min(4, Math.ceil((value / max) * 4));
};

/** GitHub-style calendar of the user's daily submissions over the last year. */
export const SubmissionActivity = ({ className }: { className?: string }) => {
    const { t } = useTranslation();
    const [acceptedOnly, setAcceptedOnly] = useState(false);
    const { data, isPending } = useQuery(statsQueries.submissions(acceptedOnly));

    const { weeks, total, max } = useMemo(() => {
        const days = [...(data ?? [])].sort((a, b) => a.time.getTime() - b.time.getTime());
        const weeks: (typeof days)[] = [];

        for (const day of days) {
            if (weeks.length === 0 || day.time.getDay() === 0) weeks.push([]);

            weeks.at(-1)!.push(day);
        }

        return {
            weeks,
            total: days.reduce((sum, day) => sum + day.count, 0),
            max: Math.max(1, ...days.map((day) => day.count)),
        };
    }, [data]);

    return (
        <div className={cn("bg-card flex w-full flex-col gap-3 rounded-md border p-4", className)}>
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-4">
                    <span className="text-base font-medium">{t("activity.title")}</span>
                    <label className="text-muted-foreground flex items-center gap-2 text-sm">
                        <Switch checked={acceptedOnly} onCheckedChange={setAcceptedOnly} />
                        {t("activity.acceptedOnly")}
                    </label>
                </div>
                <span className="text-muted-foreground text-sm">
                    {t("activity.total", { count: total })}
                </span>
            </div>
            {isPending ? (
                <Skeleton className="h-[92px] w-full" />
            ) : (
                <div className="overflow-x-auto pb-1">
                    <div className="flex w-max gap-[3px]">
                        {weeks.map((week, index) => (
                            <div
                                key={index}
                                className={cn(
                                    "flex flex-col gap-[3px]",
                                    index === 0 && "justify-end"
                                )}
                            >
                                {week.map((day) => (
                                    <Tooltip key={day.time.getTime()}>
                                        <TooltipTrigger asChild>
                                            <div
                                                className={cn(
                                                    "size-[11px] rounded-[2px]",
                                                    levels[levelFor(day.count, max)]
                                                )}
                                            />
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            {t("activity.day", {
                                                count: day.count,
                                                date: formatDate(day.time),
                                            })}
                                        </TooltipContent>
                                    </Tooltip>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            )}
            <div className="text-muted-foreground flex items-center justify-end gap-1 text-xs">
                {t("activity.less")}
                {levels.map((level) => (
                    <div key={level} className={cn("size-[11px] rounded-[2px]", level)} />
                ))}
                {t("activity.more")}
            </div>
        </div>
    );
};
