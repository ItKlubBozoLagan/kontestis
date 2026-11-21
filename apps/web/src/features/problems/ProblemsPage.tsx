import type { ProblemSummary } from "@kontestis/models";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createColumnHelper } from "@tanstack/react-table";
import { CheckCircle2, CircleDashed, Layers, Trophy } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

import { problemQueries } from "@/api/problems";
import { ScoreBadge } from "@/components/badges/ScoreBadge";
import { TagBadge } from "@/components/badges/TagBadge";
import { DataTable } from "@/components/common/DataTable";
import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { formatDateTime } from "@/lib/format";

type Status = "all" | "solved" | "unsolved" | "unattempted";

const isSolved = (problem: ProblemSummary) =>
    problem.best_score !== null && problem.score > 0 && problem.best_score >= problem.score;

const column = createColumnHelper<ProblemSummary>();

export const ProblemsPage = () => {
    const { t } = useTranslation();
    const { data: problems } = useSuspenseQuery(problemQueries.summaries());
    const [status, setStatus] = useState<Status>("all");
    const [tag, setTag] = useState<string>("any");

    const tags = useMemo(
        () => [...new Set(problems.flatMap((problem) => problem.tags))].sort(),
        [problems]
    );

    const filtered = useMemo(
        () =>
            problems.filter((problem) => {
                if (tag !== "any" && !problem.tags.includes(tag)) return false;

                switch (status) {
                    case "solved":
                        return isSolved(problem);
                    case "unsolved":
                        return problem.attempts > 0 && !isSolved(problem);
                    case "unattempted":
                        return problem.attempts === 0;
                    default:
                        return true;
                }
            }),
        [problems, status, tag]
    );

    const stats = useMemo(
        () => ({
            solved: problems.filter(isSolved).length,
            attempted: problems.filter((problem) => problem.attempts > 0).length,
            points: problems.reduce((sum, problem) => sum + (problem.best_score ?? 0), 0),
            maxPoints: problems.reduce((sum, problem) => sum + problem.score, 0),
        }),
        [problems]
    );

    const columns = useMemo(
        () => [
            column.accessor("title", {
                header: t("problems.table.name"),
                cell: (info) => (
                    <Link
                        to={`/problem/${info.row.original.id}`}
                        className="hover:text-primary flex items-center gap-2 font-medium"
                    >
                        {isSolved(info.row.original) ? (
                            <CheckCircle2 className="size-4 shrink-0 text-green-600" />
                        ) : (
                            <CircleDashed className="text-muted-foreground size-4 shrink-0" />
                        )}
                        {info.getValue()}
                    </Link>
                ),
            }),
            column.accessor("contest_name", {
                header: t("problems.table.contest"),
                cell: (info) => (
                    <Link
                        to={`/contest/${info.row.original.contest_id}`}
                        className="text-muted-foreground hover:text-primary"
                    >
                        {info.getValue()}
                    </Link>
                ),
            }),
            column.accessor((row) => row.contest_start_time.getTime(), {
                id: "added",
                header: t("problems.table.added"),
                cell: (info) => formatDateTime(info.row.original.contest_start_time),
                enableGlobalFilter: false,
            }),
            column.accessor((row) => (row.score > 0 ? (row.best_score ?? -1) / row.score : -1), {
                id: "score",
                header: t("problems.table.score"),
                cell: (info) => (
                    <ScoreBadge
                        score={info.row.original.best_score}
                        max={info.row.original.score}
                        dimWhenUnattempted
                    />
                ),
                enableGlobalFilter: false,
            }),
            column.accessor("attempts", {
                header: t("problems.table.attempts"),
                meta: { className: "text-right w-0" },
                enableGlobalFilter: false,
            }),
            column.accessor((row) => row.tags.join(" "), {
                id: "tags",
                header: t("problems.table.tags"),
                enableSorting: false,
                cell: (info) =>
                    info.row.original.tags.length === 0 ? (
                        <span className="text-muted-foreground font-sans text-xs">
                            {t("problems.table.noTags")}
                        </span>
                    ) : (
                        <div className="flex max-w-56 flex-wrap gap-1">
                            {info.row.original.tags.map((it) => (
                                <TagBadge key={it} tag={it} />
                            ))}
                        </div>
                    ),
            }),
        ],
        [t]
    );

    return (
        <>
            <PageHeader
                title={t("problems.page.title")}
                description={t("problems.page.description")}
            />
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <StatCard label={t("problems.stats.total")} value={problems.length} icon={Layers} />
                <StatCard
                    label={t("problems.stats.solved")}
                    value={stats.solved}
                    icon={CheckCircle2}
                />
                <StatCard
                    label={t("problems.stats.attempted")}
                    value={stats.attempted}
                    icon={CircleDashed}
                />
                <StatCard
                    label={t("problems.stats.points")}
                    value={stats.points}
                    hint={`/ ${stats.maxPoints}`}
                    icon={Trophy}
                />
            </div>
            <DataTable
                columns={columns}
                data={filtered}
                searchable
                pageSize={50}
                getRowId={(row) => row.id.toString()}
                rowHref={(row) => `/problem/${row.id}`}
                toolbar={
                    <>
                        <ToggleGroup
                            type="single"
                            variant="outline"
                            size="sm"
                            value={status}
                            onValueChange={(value) => value && setStatus(value as Status)}
                        >
                            {(["all", "solved", "unsolved", "unattempted"] as const).map((it) => (
                                <ToggleGroupItem key={it} value={it} className="px-3">
                                    {t(`problems.filters.${it}`)}
                                </ToggleGroupItem>
                            ))}
                        </ToggleGroup>
                        {tags.length > 0 && (
                            <Select value={tag} onValueChange={setTag}>
                                <SelectTrigger size="sm" className="w-40">
                                    <SelectValue placeholder={t("problems.filters.tag")} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="any">
                                        {t("problems.filters.anyTag")}
                                    </SelectItem>
                                    {tags.map((it) => (
                                        <SelectItem key={it} value={it}>
                                            {it}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    </>
                }
            />
        </>
    );
};
