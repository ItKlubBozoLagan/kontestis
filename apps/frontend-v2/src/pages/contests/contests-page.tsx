import { ContestWithPermissions } from "@kontestis/models";
import { format } from "date-fns";
import { Calendar, Check, Clock, Search, Trophy, UserPlus, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { useSelfContestMembers } from "@/api/contest-extras";
import { useAllContests, useRegisterContest } from "@/api/contests";
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
import { useTranslation } from "@/i18n";

export function ContestsPage() {
    const { data: contests, isLoading } = useAllContests();
    const { t } = useTranslation();
    const [search, setSearch] = useState("");

    const now = Date.now();

    const getContestStatus = (contest: { start_time: Date; duration_seconds: number }) => {
        const startTime = new Date(contest.start_time).getTime();
        const endTime = startTime + contest.duration_seconds * 1000;

        if (now < startTime) return "upcoming";

        if (now < endTime) return "running";

        return "finished";
    };

    const filteredContests = useMemo(() => {
        return (contests ?? [])
            .filter((contest) => {
                return contest.name.toLowerCase().includes(search.toLowerCase());
            })
            .sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime());
    }, [contests, search]);

    const officialContests = useMemo(() => {
        return filteredContests.filter((contest) => contest.official);
    }, [filteredContests]);

    const unofficialContests = useMemo(() => {
        return filteredContests.filter((contest) => !contest.official);
    }, [filteredContests]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Spinner size="lg" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                        <Trophy className="h-8 w-8" />
                        {t("contests.page.official")}
                    </h1>
                </div>
            </div>

            {/* Search */}
            <div className="flex gap-4 items-center">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder={t("contests.page.searchPlaceholder")}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9"
                    />
                </div>
            </div>

            {/* Official Contests Table */}
            <div className="space-y-3">
                <h2 className="text-lg font-semibold">{t("contests.page.official")}</h2>
                <div className="border rounded-lg overflow-hidden">
                    {officialContests.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8">
                            <p className="text-muted-foreground">
                                {search
                                    ? t("contests.page.noOfficialContestsFiltered")
                                    : t("contests.page.noOfficialContests")}
                            </p>
                        </div>
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
                                {officialContests.map((contest, index) => (
                                    <ContestTableRow
                                        key={contest.id.toString()}
                                        contest={contest}
                                        getContestStatus={getContestStatus}
                                        isEven={index % 2 === 0}
                                    />
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </div>
            </div>

            {/* Unofficial Contests Table */}
            <div className="space-y-3">
                <h2 className="text-lg font-semibold text-muted-foreground">
                    {t("contests.page.unofficial")}
                </h2>
                <div className="border rounded-lg overflow-hidden">
                    {unofficialContests.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8">
                            <p className="text-muted-foreground">
                                {search
                                    ? t("contests.page.noUnofficialContestsFiltered")
                                    : t("contests.page.noUnofficialContests")}
                            </p>
                        </div>
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
                                {unofficialContests.map((contest, index) => (
                                    <ContestTableRow
                                        key={contest.id.toString()}
                                        contest={contest}
                                        getContestStatus={getContestStatus}
                                        isEven={index % 2 === 0}
                                    />
                                ))}
                            </TableBody>
                        </Table>
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

interface ContestTableRowProperties {
    contest: ContestWithPermissions;
    getContestStatus: (contest: { start_time: Date; duration_seconds: number }) => string;
    isEven?: boolean;
}

function ContestTableRow({ contest, getContestStatus, isEven }: ContestTableRowProperties) {
    const [timeRemaining, setTimeRemaining] = useState<number>(0);
    const [localRegistered, setLocalRegistered] = useState(false);
    const { t } = useTranslation();
    const registerMutation = useRegisterContest(contest.id);
    const { data: members } = useSelfContestMembers();

    // Check if registered using self contest members
    const isRegistered = members?.some((m) => m.contest_id === contest.id) ?? false;
    const registered = isRegistered || localRegistered;

    const status = getContestStatus(contest);
    const startTime = new Date(contest.start_time).getTime();
    const endTime = startTime + contest.duration_seconds * 1000;

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

    const handleRegister = async () => {
        registerMutation.mutate(undefined, {
            onSuccess: () => setLocalRegistered(true),
        });
    };

    return (
        <TableRow className={isEven ? "bg-muted/30" : ""}>
            <TableCell>
                <Link
                    to={`/contest/${contest.id}`}
                    className="font-medium hover:text-primary transition-colors"
                >
                    {contest.name}
                </Link>
            </TableCell>
            <TableCell>
                <div className="flex items-center gap-2 text-muted-foreground">
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
                            <UserPlus className="h-4 w-4" />
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
                            <X className="h-4 w-4 text-red-400" />
                        )}
                    </div>
                )}
            </TableCell>
        </TableRow>
    );
}
