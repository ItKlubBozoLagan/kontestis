import type {
    Contest,
    ExamFinalSubmissionWithProblemId,
    SubmissionByProblemResponse,
} from "@kontestis/models";
import { useQuery } from "@tanstack/react-query";
import { createColumnHelper } from "@tanstack/react-table";
import type { TFunction } from "i18next";
import { Check, Loader2, Minus, RotateCcw, X } from "lucide-react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { toast } from "sonner";

import { useCurrentUser } from "@/api/auth";
import type { VisibleProblem } from "@/api/problems";
import {
    type ProblemSubmissionListItem,
    submissionQueries,
    useReevaluateSubmission,
    useSetFinalSubmission,
} from "@/api/submissions";
import { ScoreBadge } from "@/components/badges/ScoreBadge";
import { VerdictBadge } from "@/components/badges/VerdictBadge";
import { DataTable } from "@/components/common/DataTable";
import { Button } from "@/components/ui/button";
import { snowflakeTime } from "@/features/submissions/snowflake";
import { useNow } from "@/hooks/useNow";
import { contestPhase } from "@/lib/contest";
import { formatDateTime } from "@/lib/format";

type Row = {
    id: bigint;
    completed: boolean;
    full_name?: string;
    verdict?: string;
    time_used_millis?: number;
    memory_used_megabytes?: number;
    language: string;
    awarded_score?: number;
    samples_passed?: boolean;
    reevaluation?: boolean;
};

const column = createColumnHelper<Row>();

const SamplesCell = ({ value }: { value: boolean | undefined }) =>
    value === undefined || value === null ? (
        <Minus className="text-muted-foreground size-4" />
    ) : value ? (
        <Check className="size-4 text-green-600" />
    ) : (
        <X className="size-4 text-red-600" />
    );

const FinalCell = ({
    row,
    contest,
    finals,
}: {
    row: Row;
    contest: Contest;
    finals: ExamFinalSubmissionWithProblemId[] | undefined;
}) => {
    const { t } = useTranslation();
    const now = useNow();
    const setFinal = useSetFinalSubmission();

    if (!row.completed) return null;

    if (finals?.some((final) => final.submission_id === row.id))
        return (
            <span className="font-sans font-medium text-green-600">
                {t("submissions.body.final")}
            </span>
        );

    if (contestPhase(contest, now) !== "running")
        return (
            <span className="text-muted-foreground font-sans">
                {t("submissions.body.notSubmitted")}
            </span>
        );

    return (
        <Button
            size="sm"
            variant="outline"
            className="h-7"
            disabled={setFinal.isPending}
            onClick={() =>
                setFinal.mutate(row.id, {
                    onSuccess: () => toast.success(t("submissions.body.finalSet")),
                })
            }
        >
            {t("submissions.body.setFinal")}
        </Button>
    );
};

const RejudgeCell = ({ row }: { row: Row }) => {
    const { t } = useTranslation();
    const reevaluate = useReevaluateSubmission();

    return (
        <Button
            size="sm"
            variant="outline"
            className="h-7"
            disabled={row.reevaluation || reevaluate.isPending}
            onClick={() =>
                reevaluate.mutate(row.id, {
                    onSuccess: () => toast.success(t("submissions.view.reevaluating")),
                })
            }
        >
            {row.reevaluation ? <Loader2 className="animate-spin" /> : <RotateCcw />}
            {t("submissions.table.rejudge")}
        </Button>
    );
};

type ColumnOptions = {
    t: TFunction;
    mode: "mine" | "all";
    maxScore: number;
    contest: Contest;
    finals: ExamFinalSubmissionWithProblemId[] | undefined;
    canRejudge: boolean;
};

const userColumns = (t: TFunction, mode: "mine" | "all") =>
    mode === "all"
        ? [
              column.accessor("full_name", {
                  header: t("submissions.table.user"),
                  cell: (info) => <span className="font-sans">{info.getValue()}</span>,
              }),
          ]
        : [];

const actionColumns = ({ t, mode, contest, finals, canRejudge }: ColumnOptions) => [
    ...(mode === "mine" && contest.exam
        ? [
              column.display({
                  id: "final",
                  header: t("submissions.table.final"),
                  cell: (info) => (
                      <FinalCell row={info.row.original} contest={contest} finals={finals} />
                  ),
              }),
          ]
        : []),
    ...(canRejudge
        ? [
              column.display({
                  id: "rejudge",
                  header: t("submissions.table.rejudge"),
                  cell: (info) => <RejudgeCell row={info.row.original} />,
              }),
          ]
        : []),
];

const buildColumns = ({ t, mode, maxScore, contest, finals, canRejudge }: ColumnOptions) => [
    ...userColumns(t, mode),
    column.accessor("verdict", {
        header: t("submissions.table.verdict"),
        cell: (info) =>
            info.row.original.completed ? (
                <Link to={`/submission/${info.row.original.id}`}>
                    <VerdictBadge verdict={info.getValue() ?? "pending"} />
                </Link>
            ) : (
                <VerdictBadge verdict="pending" />
            ),
    }),
    column.accessor("time_used_millis", {
        header: t("submissions.table.time"),
        cell: (info) => (info.row.original.completed ? `${info.getValue() ?? 0} ms` : "–"),
    }),
    column.accessor("memory_used_megabytes", {
        header: t("submissions.table.memory"),
        cell: (info) => (info.row.original.completed ? `${info.getValue() ?? 0} MiB` : "–"),
    }),
    column.accessor("language", {
        header: t("submissions.table.language"),
        cell: (info) =>
            t(`programmingLanguages.${info.getValue()}` as "programmingLanguages.cpp", {
                defaultValue: info.getValue(),
            }),
    }),
    column.accessor("awarded_score", {
        header: t("submissions.table.points"),
        cell: (info) =>
            info.row.original.completed ? (
                <ScoreBadge score={info.getValue() ?? 0} max={maxScore} />
            ) : (
                "–"
            ),
    }),
    column.accessor("samples_passed", {
        header: t("submissions.table.samples"),
        enableSorting: false,
        cell: (info) =>
            info.row.original.completed ? <SamplesCell value={info.getValue()} /> : null,
    }),
    column.accessor((row) => snowflakeTime(row.id).getTime(), {
        id: "submitted",
        header: t("submissions.table.submitted"),
        cell: (info) => formatDateTime(snowflakeTime(info.row.original.id)),
    }),
    ...actionColumns({ t, mode, maxScore, contest, finals, canRejudge }),
];

type Props = {
    problem: VisibleProblem;
    contest: Contest;
} & ({ mode: "mine" } | { mode: "all"; canRejudge: boolean });

/**
 * Submissions of a problem. "mine" includes pending submissions (polled until evaluated) and the
 * exam "final submission" column; "all" lists every participant's submissions for staff.
 */
export const SubmissionsTable = (props: Props) => {
    const { problem, contest, mode } = props;
    const { t } = useTranslation();
    const user = useCurrentUser();
    const canRejudge = props.mode === "all" && props.canRejudge;

    const mine = useQuery({ ...submissionQueries.byProblem(problem.id), enabled: mode === "mine" });
    const all = useQuery({
        ...submissionQueries.allForProblem(problem.id),
        enabled: mode === "all",
    });
    const { data: finals } = useQuery({
        ...submissionQueries.finalForUser(contest.id, user.id),
        enabled: mode === "mine" && contest.exam,
    });

    const rows: Row[] = useMemo(() => {
        const source: (SubmissionByProblemResponse | ProblemSubmissionListItem)[] =
            (mode === "mine" ? mine.data : all.data) ?? [];

        return source
            .map((it) => ({ completed: true, ...it } as unknown as Row))
            .sort((a, b) => (BigInt(b.id) > BigInt(a.id) ? 1 : -1));
    }, [mode, mine.data, all.data]);

    const columns = useMemo(
        () => buildColumns({ t, mode, maxScore: problem.score, contest, finals, canRejudge }),
        [t, mode, problem.score, contest, finals, canRejudge]
    );

    return (
        <DataTable
            columns={columns}
            data={rows}
            pageSize={mode === "all" ? 25 : 10}
            searchable={mode === "all"}
            getRowId={(row) => row.id.toString()}
            rowHref={(row) => (row.completed ? `/submission/${row.id}` : undefined)}
            empty={
                (mode === "mine" ? mine.isPending : all.isPending) ? (
                    <Loader2 className="mx-auto size-5 animate-spin" />
                ) : (
                    t("submissions.empty")
                )
            }
        />
    );
};
