import { zodResolver } from "@hookform/resolvers/zod";
import { format, startOfDay, subDays } from "date-fns";
import {
    AlertCircle,
    Calendar,
    Check,
    ChevronDown,
    ChevronUp,
    Clock,
    LogIn,
    Trophy,
    UserPlus,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";

import { useSelfContestMembers } from "@/api/contest-extras";
import { useAllContests, useJoinContestByCode, useRegisterContest } from "@/api/contests";
import { useSiteAlerts } from "@/api/notifications";
import { useSubmissionStats } from "@/api/stats";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useTranslation } from "@/i18n";
import { cn } from "@/lib/utils";

const JoinContestSchema = z.object({
    code: z.string().length(16, { message: "Code must be 16 characters long" }),
});

type JoinContestFormData = z.infer<typeof JoinContestSchema>;

export function DashboardPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { data: contests, isLoading: contestsLoading } = useAllContests();
    const { data: alerts, isLoading: alertsLoading } = useSiteAlerts();
    const { data: submissionStats, isLoading: statsLoading } = useSubmissionStats(false);

    const [alertsExpanded, setAlertsExpanded] = useState(false);
    const [joinDialogOpen, setJoinDialogOpen] = useState(false);

    const {
        mutate: joinContest,
        isPending: isJoining,
        error: joinError,
        data: joinData,
    } = useJoinContestByCode();

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm<JoinContestFormData>({
        resolver: zodResolver(JoinContestSchema) as any,
    });

    const onJoinSubmit = handleSubmit((data) => {
        joinContest({ code: data.code });
    });

    // Handle successful join
    useEffect(() => {
        if (joinData) {
            setJoinDialogOpen(false);
            reset();
            // Navigate to the joined contest
            navigate(`/contest/${joinData.contest_id}`);
        }
    }, [joinData, navigate, reset]);

    // Combine running and upcoming contests
    const activeContests = useMemo(() => {
        const now = Date.now();

        return (contests ?? [])
            .filter((c) => {
                const startTime = new Date(c.start_time).getTime();
                const endTime = startTime + c.duration_seconds * 1000;

                // Include running or upcoming (within next 7 days or first 10 upcoming)
                return now < endTime;
            })
            .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
            .slice(0, 10);
    }, [contests]);

    const isLoading = contestsLoading || alertsLoading;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Spinner size="lg" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Join Contest Button */}
            <div className="flex justify-center">
                <Dialog
                    open={joinDialogOpen}
                    onOpenChange={(open) => {
                        setJoinDialogOpen(open);

                        if (!open) reset();
                    }}
                >
                    <DialogTrigger asChild>
                        <Button size="lg" className="gap-2">
                            <LogIn className="h-5 w-5" />
                            {t("contestJoin.buttonText")}
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <form onSubmit={onJoinSubmit}>
                            <DialogHeader>
                                <DialogTitle>{t("contestJoin.buttonText")}</DialogTitle>
                            </DialogHeader>
                            <div className="py-4 space-y-4">
                                {(joinError || errors.code) && (
                                    <div className="text-destructive text-sm text-center">
                                        {joinError ? "Invalid code" : errors.code?.message}
                                    </div>
                                )}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">
                                        {t("contestJoin.inputTitle")}
                                    </label>
                                    <Input
                                        {...register("code")}
                                        placeholder="XXXXXXXXXXXXXXXX"
                                        className="font-mono text-center text-lg tracking-widest"
                                        maxLength={16}
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="submit" disabled={isJoining}>
                                    {isJoining ? <Spinner size="sm" className="mr-2" /> : null}
                                    {t("contestJoin.submitText")}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Contests Table */}
            <div className="space-y-3">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Trophy className="h-5 w-5" />
                    {t("navbar.contests")}
                </h2>
                <div className="border rounded-lg overflow-hidden">
                    {activeContests.length === 0 ? (
                        <p className="text-muted-foreground text-center py-4">
                            {t("helper.tableNoContents")}
                        </p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{t("contests.table.head.name")}</TableHead>
                                    <TableHead>{t("contests.table.head.startTime")}</TableHead>
                                    <TableHead>{t("contests.table.head.starts.label")}</TableHead>
                                    <TableHead>{t("contests.table.head.duration")}</TableHead>
                                    <TableHead className="text-right">
                                        {t("contests.table.head.partaking")}
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {activeContests.map((contest, index) => (
                                    <DashboardContestRow
                                        key={contest.id.toString()}
                                        contest={contest}
                                        isEven={index % 2 === 0}
                                    />
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </div>
                <Button variant="outline" className="w-full" asChild>
                    <Link to="/contests">View All Contests</Link>
                </Button>
            </div>

            {/* Site Alerts */}
            <div className="space-y-3">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    {t("dashboard.alerts.title")}
                </h2>
                <div className="border rounded-lg overflow-hidden">
                    {(alerts ?? []).length === 0 ? (
                        <p className="text-muted-foreground text-center py-4">
                            {t("dashboard.alerts.none")}
                        </p>
                    ) : (
                        <div className="space-y-3 p-3">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[150px]">Date</TableHead>
                                        <TableHead>Message</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {(alerts ?? [])
                                        .slice(0, alertsExpanded ? 8 : 2)
                                        .map((alert, index) => (
                                            <TableRow
                                                key={alert.id.toString()}
                                                className={index % 2 === 0 ? "bg-muted/30" : ""}
                                            >
                                                <TableCell className="text-muted-foreground text-sm">
                                                    {format(
                                                        new Date(alert.created_at),
                                                        "MMM d, yyyy HH:mm"
                                                    )}
                                                </TableCell>
                                                <TableCell>{alert.data}</TableCell>
                                            </TableRow>
                                        ))}
                                </TableBody>
                            </Table>
                            {(alerts ?? []).length > 2 && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="w-full"
                                    onClick={() => setAlertsExpanded(!alertsExpanded)}
                                >
                                    {alertsExpanded ? (
                                        <>
                                            <ChevronUp className="h-4 w-4 mr-2" />
                                            Collapse
                                        </>
                                    ) : (
                                        <>
                                            <ChevronDown className="h-4 w-4 mr-2" />
                                            View older
                                        </>
                                    )}
                                </Button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Activity Calendar */}
            <div className="space-y-3">
                <h2 className="text-lg font-semibold flex items-center justify-between">
                    <span>{t("dashboard.activity.title")}</span>
                    {submissionStats && (
                        <span className="text-sm font-normal text-muted-foreground">
                            {t("account.stats.submissions.total")}:{" "}
                            {submissionStats.reduce(
                                (sum, s) =>
                                    sum +
                                    (typeof s.last === "number" && !Number.isNaN(s.last)
                                        ? s.last
                                        : 0),
                                0
                            )}
                        </span>
                    )}
                </h2>
                <div className="border rounded-lg p-4 flex justify-center overflow-hidden">
                    {statsLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <Spinner size="md" />
                        </div>
                    ) : (
                        <ActivityCalendar data={submissionStats ?? []} />
                    )}
                </div>
            </div>
        </div>
    );
}

// Format countdown time
function formatCountdown(ms: number): string {
    if (ms <= 0) return "0s";

    const totalSeconds = Math.floor(ms / 1000);
    const days = Math.floor(totalSeconds / 86_400);
    const hours = Math.floor((totalSeconds % 86_400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const parts: string[] = [];

    if (days > 0) parts.push(`${days}d`);

    if (hours > 0) parts.push(`${hours}h`);

    if (minutes > 0) parts.push(`${minutes}m`);

    if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`);

    return parts.join(" ");
}

// Dashboard contest row with register button
interface DashboardContestRowProperties {
    contest: {
        id: bigint;
        name: string;
        start_time: Date;
        duration_seconds: number;
    };
    isEven?: boolean;
}

function DashboardContestRow({ contest, isEven }: DashboardContestRowProperties) {
    const { t } = useTranslation();
    const { data: members } = useSelfContestMembers();
    const [timeRemaining, setTimeRemaining] = useState<number>(0);
    const [localRegistered, setLocalRegistered] = useState(false);
    const { mutate: registerContest, isPending: isRegistering } = useRegisterContest(contest.id);

    const startTime = new Date(contest.start_time).getTime();
    const endTime = startTime + contest.duration_seconds * 1000;

    // Check if registered using self contest members
    const isRegistered = members?.some((m) => m.contest_id === contest.id) ?? false;
    const registered = isRegistered || localRegistered;

    // Determine status
    const getStatus = () => {
        const now = Date.now();

        if (now < startTime) return "upcoming";

        if (now < endTime) return "running";

        return "finished";
    };

    const status = getStatus();

    // Live countdown timer
    useEffect(() => {
        const updateTimer = () => {
            const now = Date.now();

            if (status === "upcoming") {
                setTimeRemaining(startTime - now);
            } else if (status === "running") {
                setTimeRemaining(endTime - now);
            } else {
                setTimeRemaining(0);
            }
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);

        return () => clearInterval(interval);
    }, [status, startTime, endTime]);

    const handleRegister = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        registerContest(undefined, {
            onSuccess: () => setLocalRegistered(true),
        });
    };

    return (
        <TableRow className={`cursor-pointer hover:bg-accent ${isEven ? "bg-muted/30" : ""}`}>
            <TableCell>
                <Link to={`/contest/${contest.id}`} className="font-medium hover:text-primary">
                    {contest.name}
                </Link>
            </TableCell>
            <TableCell className="text-muted-foreground">
                <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(contest.start_time), "MMM d, yyyy HH:mm")}
                </div>
            </TableCell>
            <TableCell>
                {/* Starts column - show countdown if pending, "Started" if running, "Finished" if finished */}
                {status === "upcoming" ? (
                    <span className="font-mono text-muted-foreground">
                        {formatCountdown(timeRemaining)}
                    </span>
                ) : status === "running" ? (
                    <span className="text-green-600 font-medium">
                        {t("contests.table.body.starts.started")}
                    </span>
                ) : (
                    <span className="text-red-600">{t("contests.table.body.starts.finished")}</span>
                )}
            </TableCell>
            <TableCell>
                {/* Duration column - show remaining time if running, otherwise duration */}
                {status === "running" ? (
                    <span className="font-mono text-muted-foreground">
                        {formatCountdown(timeRemaining)}
                    </span>
                ) : (
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        {Math.floor(contest.duration_seconds / 3600)}h{" "}
                        {Math.floor((contest.duration_seconds % 3600) / 60)}m
                    </div>
                )}
            </TableCell>
            <TableCell className="text-right">
                {status !== "finished" ? (
                    registered ? (
                        <span className="text-green-600 flex items-center justify-end gap-1">
                            <Check className="h-4 w-4" />
                            {t("contests.table.body.registered.registered")}
                        </span>
                    ) : (
                        <span
                            className="text-yellow-600 hover:text-yellow-700 cursor-pointer flex items-center justify-end gap-1"
                            onClick={handleRegister}
                        >
                            {isRegistering ? (
                                <Spinner size="sm" />
                            ) : (
                                <UserPlus className="h-4 w-4" />
                            )}
                            {t("contests.table.body.registered.notRegistered")}
                        </span>
                    )
                ) : (
                    <div className="flex items-center justify-end gap-1">
                        {registered ? (
                            <>
                                <Check className="h-4 w-4 text-green-600" />
                                <span className="text-green-600">
                                    {t("contests.table.body.registered.registered")}
                                </span>
                            </>
                        ) : (
                            <span className="text-muted-foreground">-</span>
                        )}
                    </div>
                )}
            </TableCell>
        </TableRow>
    );
}

interface ActivityCalendarProperties {
    data: { time: Date; last: number }[];
}

function ActivityCalendar({ data }: ActivityCalendarProperties) {
    const { t } = useTranslation();

    // Build a map of date -> count for the last 365 days
    const today = startOfDay(new Date());
    const dataMap = useMemo(() => {
        const map = new Map<string, number>();

        for (const d of data) {
            // Safely handle potentially invalid values
            const count = typeof d.last === "number" && !Number.isNaN(d.last) ? d.last : 0;

            if (count > 0) {
                const dateKey = startOfDay(new Date(d.time)).toISOString();

                map.set(dateKey, (map.get(dateKey) ?? 0) + count);
            }
        }

        return map;
    }, [data]);

    // Calculate max for color scaling
    const maxValue = useMemo(() => {
        const values = Array.from(dataMap.values()).filter((v) => !Number.isNaN(v) && v > 0);

        return Math.max(1, ...values);
    }, [dataMap]);

    // Generate weeks (52 weeks + current partial week)
    const weeks = useMemo(() => {
        const result: { date: Date; count: number }[][] = [];
        let currentWeek: { date: Date; count: number }[] = [];

        for (let index = 365; index >= 0; index--) {
            const date = subDays(today, index);
            const dateKey = startOfDay(date).toISOString();
            const count = dataMap.get(dateKey) ?? 0;

            currentWeek.push({ date, count });

            // Start new week on Sunday (day 0)
            if (date.getDay() === 0 || index === 0) {
                result.push(currentWeek);
                currentWeek = [];
            }
        }

        return result;
    }, [today, dataMap]);

    // Calculate which months to show labels for
    const monthLabelsData = useMemo(() => {
        const labels: { weekIndex: number; month: number }[] = [];
        let lastMonth = -1;

        for (const [weekIndex, week] of weeks.entries()) {
            const firstDay = week[0]?.date;

            if (firstDay) {
                const month = firstDay.getMonth();

                if (month !== lastMonth) {
                    labels.push({ weekIndex, month });
                    lastMonth = month;
                }
            }
        }

        return labels;
    }, [weeks]);

    const getColorClass = (count: number) => {
        if (count === 0 || Number.isNaN(count)) return "bg-muted";

        const percentage = count / maxValue;

        if (percentage < 0.25) return "bg-blue-300 dark:bg-blue-800";

        if (percentage < 0.5) return "bg-blue-400 dark:bg-blue-700";

        if (percentage < 0.75) return "bg-blue-500 dark:bg-blue-600";

        return "bg-blue-600 dark:bg-blue-500";
    };

    const monthNames = t("helper.shortMonthNames").split(",");
    const dayLabels = t("helper.shortWeekDayNames").split(",");

    return (
        <div className="overflow-x-auto w-full items-center justify-center flex">
            <div className="min-w-fit">
                {/* Month labels */}
                <div className="flex gap-[3px] mb-1 ml-8 text-xs text-muted-foreground h-4">
                    {weeks.map((_, weekIndex) => {
                        const label = monthLabelsData.find((l) => l.weekIndex === weekIndex);

                        return (
                            <div
                                key={weekIndex}
                                className="w-[11px] text-left overflow-visible whitespace-nowrap"
                            >
                                {label ? monthNames[label.month] : ""}
                            </div>
                        );
                    })}
                </div>

                <div className="flex">
                    {/* Day labels */}
                    <div className="flex flex-col gap-[3px] mr-2 text-xs text-muted-foreground">
                        <div className="h-[11px]" />
                        <div className="h-[11px] flex items-center">{dayLabels[0]}</div>
                        <div className="h-[11px]" />
                        <div className="h-[11px] flex items-center">{dayLabels[2]}</div>
                        <div className="h-[11px]" />
                        <div className="h-[11px] flex items-center">{dayLabels[4]}</div>
                        <div className="h-[11px]" />
                    </div>

                    {/* Calendar grid */}
                    <div className="flex gap-[3px]">
                        <TooltipProvider delayDuration={100}>
                            {weeks.map((week, weekIndex) => (
                                <div key={weekIndex} className="flex flex-col gap-[3px]">
                                    {week.map(({ date, count }, dayIndex) => (
                                        <Tooltip key={dayIndex}>
                                            <TooltipTrigger asChild>
                                                <div
                                                    className={cn(
                                                        "w-[11px] h-[11px] rounded-sm cursor-pointer",
                                                        getColorClass(count)
                                                    )}
                                                />
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <span className="font-semibold">{count}</span>{" "}
                                                {count === 1
                                                    ? t(
                                                          "account.stats.submissions.hover.oneSubmission"
                                                      )
                                                    : t(
                                                          "account.stats.submissions.hover.moreSubmissions"
                                                      )}{" "}
                                                {format(date, "MMM d, yyyy")}
                                            </TooltipContent>
                                        </Tooltip>
                                    ))}
                                </div>
                            ))}
                        </TooltipProvider>
                    </div>
                </div>

                {/* Legend */}
                <div className="flex items-center justify-end gap-2 mt-3 text-xs text-muted-foreground">
                    <span>Less</span>
                    <div className="flex gap-[2px]">
                        <div className="w-[11px] h-[11px] rounded-sm bg-muted" />
                        <div className="w-[11px] h-[11px] rounded-sm bg-blue-300 dark:bg-blue-800" />
                        <div className="w-[11px] h-[11px] rounded-sm bg-blue-400 dark:bg-blue-700" />
                        <div className="w-[11px] h-[11px] rounded-sm bg-blue-500 dark:bg-blue-600" />
                        <div className="w-[11px] h-[11px] rounded-sm bg-blue-600 dark:bg-blue-500" />
                    </div>
                    <span>More</span>
                </div>
            </div>
        </div>
    );
}
