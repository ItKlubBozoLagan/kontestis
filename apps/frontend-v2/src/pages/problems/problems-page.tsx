import { ProblemWithScore } from "@kontestis/models";
import { toCroatianLocale } from "@kontestis/utils";
import { useQueries } from "@tanstack/react-query";
import { CheckCircle, Clock, FileCode, Filter, Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { useAllContests } from "@/api/contests";
import { http, wrapAxios } from "@/api/http";
import { useAllProblemScores } from "@/api/problems";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
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

export function ProblemsPage() {
    const { data: contests, isLoading: contestsLoading } = useAllContests();
    const { data: problemScores } = useAllProblemScores();
    const { t } = useTranslation();

    const [searchQuery, setSearchQuery] = useState("");
    const [selectedTag, setSelectedTag] = useState<string>("all");
    const [selectedRating, setSelectedRating] = useState<string>("all");

    // Fetch problems for each contest
    const problemQueries = useQueries({
        queries: (contests ?? []).map((contest) => ({
            queryKey: ["contests", contest.id.toString(), "problems"],
            queryFn: () =>
                wrapAxios<ProblemWithScore[]>(
                    http.get("/problem", { params: { contest_id: contest.id } })
                ),
            enabled: !!contests,
        })),
    });

    const isLoading = contestsLoading || problemQueries.some((q) => q.isLoading);

    const problems = useMemo(() => {
        return problemQueries
            .flatMap((q) => q.data ?? [])
            .map((problem) => ({
                ...problem,
                contest: (contests ?? []).find((c) => BigInt(c.id) === BigInt(problem.contest_id)),
            }))
            .sort((a, b) => Number(b.id) - Number(a.id));
    }, [problemQueries, contests]);

    // Extract all unique tags and rating tags
    const { regularTags, ratingTags } = useMemo(() => {
        const allTags = new Set<string>();
        const ratings = new Set<string>();

        for (const problem of problems) {
            for (const tag of problem.tags) {
                if (tag.startsWith("*")) {
                    ratings.add(tag);
                } else {
                    allTags.add(tag);
                }
            }
        }

        return {
            regularTags: Array.from(allTags).sort(),
            ratingTags: Array.from(ratings).sort((a, b) => {
                // Sort by numeric value (e.g., *1500 < *1800)
                const numberA = Number.parseInt(a.slice(1)) || 0;
                const numberB = Number.parseInt(b.slice(1)) || 0;

                return numberA - numberB;
            }),
        };
    }, [problems]);

    // Filter problems
    const filteredProblems = useMemo(() => {
        return problems.filter((problem) => {
            // Search filter
            const matchesSearch = problem.title.toLowerCase().includes(searchQuery.toLowerCase());

            // Tag filter
            const matchesTag = selectedTag === "all" || problem.tags.includes(selectedTag);

            // Rating filter
            const matchesRating = selectedRating === "all" || problem.tags.includes(selectedRating);

            return matchesSearch && matchesTag && matchesRating;
        });
    }, [problems, searchQuery, selectedTag, selectedRating]);

    const getProblemStatus = (problemId: bigint, maxScore: number) => {
        const score = problemScores?.[problemId.toString()] ?? 0;

        if (score >= maxScore) return "solved";

        if (score > 0) return "attempted";

        return "unsolved";
    };

    const clearFilters = () => {
        setSearchQuery("");
        setSelectedTag("all");
        setSelectedRating("all");
    };

    const hasActiveFilters = searchQuery || selectedTag !== "all" || selectedRating !== "all";

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
            <div>
                <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                    <FileCode className="h-8 w-8" />
                    {t("problems.page.title")}
                </h1>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-wrap gap-4 items-center">
                <div className="relative flex-1 min-w-[200px] max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder={t("problems.page.searchPlaceholder")}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                    />
                </div>

                <Select value={selectedTag} onValueChange={setSelectedTag}>
                    <SelectTrigger className="w-[180px]">
                        <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                        <SelectValue placeholder={t("problems.page.filters.allTags")} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">{t("problems.page.filters.allTags")}</SelectItem>
                        {regularTags.map((tag) => (
                            <SelectItem key={tag} value={tag}>
                                {tag}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select value={selectedRating} onValueChange={setSelectedRating}>
                    <SelectTrigger className="w-[160px]">
                        <SelectValue placeholder={t("problems.page.filters.allRatings")} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">{t("problems.page.filters.allRatings")}</SelectItem>
                        {ratingTags.map((rating) => (
                            <SelectItem key={rating} value={rating}>
                                {rating}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {hasActiveFilters && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearFilters}
                        className="text-muted-foreground hover:text-foreground"
                    >
                        <X className="h-4 w-4 mr-1" />
                        {t("problems.page.filters.clearFilters")}
                    </Button>
                )}
            </div>

            {/* Problems Table */}
            <div className="space-y-3">
                <h2 className="text-lg font-semibold">{t("problems.page.title")}</h2>
                <div className="border rounded-lg overflow-hidden">
                    {filteredProblems.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <FileCode className="h-12 w-12 text-muted-foreground mb-4" />
                            <p className="text-lg font-medium">{t("problems.page.noProblems")}</p>
                            <p className="text-muted-foreground">
                                {hasActiveFilters
                                    ? t("problems.page.noProblemsFiltered")
                                    : t("problems.page.noProblemsEmpty")}
                            </p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{t("problems.table.head.name")}</TableHead>
                                    <TableHead>{t("problems.table.head.contestName")}</TableHead>
                                    <TableHead>{t("problems.table.head.added")}</TableHead>
                                    <TableHead className="text-right">
                                        {t("problems.table.head.score")}
                                    </TableHead>
                                    <TableHead>{t("problems.table.head.tags")}</TableHead>
                                    <TableHead className="w-12 text-center">
                                        {t("problems.table.head.status")}
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredProblems.map((problem, index) => {
                                    const status = getProblemStatus(problem.id, problem.score);
                                    const userScore = problemScores?.[problem.id.toString()] ?? 0;

                                    return (
                                        <TableRow
                                            key={problem.id.toString()}
                                            className={index % 2 === 0 ? "bg-muted/30" : ""}
                                        >
                                            <TableCell>
                                                <Link
                                                    to={`/problem/${problem.id}`}
                                                    state={{ from: "problems-list" }}
                                                    className="flex items-center gap-2 hover:text-primary transition-colors font-medium"
                                                >
                                                    <FileCode className="h-4 w-4 text-muted-foreground" />
                                                    {problem.title}
                                                </Link>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {problem.contest?.name ?? "-"}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {problem.contest?.start_time
                                                    ? toCroatianLocale(problem.contest.start_time)
                                                    : "-"}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <ScoreBadge
                                                    score={userScore}
                                                    maxScore={problem.score}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex gap-1 flex-wrap max-w-[150px]">
                                                    {problem.tags.length === 0 ? (
                                                        <span className="text-muted-foreground text-sm">
                                                            No tags
                                                        </span>
                                                    ) : (
                                                        problem.tags.sort().map((tag) => (
                                                            <Badge
                                                                key={tag}
                                                                variant="secondary"
                                                                className="text-xs"
                                                            >
                                                                {tag}
                                                            </Badge>
                                                        ))
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <StatusIcon status={status} />
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    )}
                </div>
            </div>
        </div>
    );
}

function StatusIcon({ status }: { status: string }) {
    if (status === "solved") {
        return <CheckCircle className="h-5 w-5 text-green-500" />;
    }

    if (status === "attempted") {
        return <Clock className="h-5 w-5 text-yellow-500" />;
    }

    return <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30" />;
}

function ScoreBadge({ score, maxScore }: { score: number; maxScore: number }) {
    const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;

    // Only color the badge if there's an actual score (submission exists)
    let colorClass = "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";

    if (score > 0) {
        colorClass =
            percentage === 100
                ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300";
    }

    return (
        <Badge className={colorClass}>
            {score}/{maxScore}
        </Badge>
    );
}
