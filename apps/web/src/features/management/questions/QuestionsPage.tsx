import type { ContestQuestion } from "@kontestis/models";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { MessageSquare } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { contestQueries } from "@/api/contests";
import { DataTable } from "@/components/common/DataTable";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { needsReply } from "@/features/management/shared/questions";
import { useManagedContest } from "@/features/management/useManagedContest";
import { formatDateTime } from "@/lib/format";

type Row = ContestQuestion & { member_name: string; open: boolean };

export const QuestionsPage = () => {
    const { t } = useTranslation();
    const contest = useManagedContest();
    const { data: threads } = useSuspenseQuery(contestQueries.questions(contest.id));
    const { data: members } = useQuery(contestQueries.leaderboard(contest.id, true));
    const [onlyOpen, setOnlyOpen] = useState(false);

    const rows = useMemo<Row[]>(() => {
        const names = new Map(members?.map((member) => [member.id.toString(), member.full_name]));

        return threads
            .map((thread) => ({
                ...thread,
                member_name:
                    names.get(thread.contest_member_id.toString()) ??
                    t("management.questions.unknownMember"),
                open: needsReply(thread),
            }))
            .filter((thread) => !onlyOpen || thread.open)
            .sort(
                (a, b) =>
                    (b.last_message_at?.getTime() ?? 0) - (a.last_message_at?.getTime() ?? 0) ||
                    (b.id > a.id ? 1 : -1)
            );
    }, [threads, members, onlyOpen, t]);

    const columns = useMemo<ColumnDef<Row>[]>(
        () => [
            {
                accessorKey: "question",
                header: t("management.questions.subject"),
                cell: ({ row }) => (
                    <span className="flex items-center gap-2 font-sans">
                        <MessageSquare className="text-muted-foreground size-4 shrink-0" />
                        <span className="max-w-[340px] truncate">{row.original.question}</span>
                    </span>
                ),
            },
            { accessorKey: "member_name", header: t("management.questions.member") },
            {
                accessorKey: "open",
                header: t("management.questions.status"),
                cell: ({ row }) =>
                    row.original.open ? (
                        <Badge
                            variant="outline"
                            className="border-amber-300 bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-200"
                        >
                            {t("management.questions.needsReply")}
                        </Badge>
                    ) : (
                        <Badge
                            variant="outline"
                            className="border-green-300 bg-green-50 text-green-800 dark:bg-green-950 dark:text-green-200"
                        >
                            {t("management.questions.replied")}
                        </Badge>
                    ),
            },
            {
                id: "last",
                accessorFn: (row) => row.last_message_at?.getTime() ?? 0,
                header: t("management.questions.lastActivity"),
                cell: ({ row }) =>
                    row.original.last_message_at
                        ? formatDateTime(row.original.last_message_at)
                        : "–",
            },
        ],
        [t]
    );

    return (
        <DataTable
            columns={columns}
            data={rows}
            searchable
            pageSize={25}
            rowHref={(thread) => `/management/${contest.id}/questions/${thread.id}`}
            rowClassName={(row) => (row.original.open ? "font-semibold" : undefined)}
            empty={t("management.questions.empty")}
            toolbar={
                <label className="text-muted-foreground flex items-center gap-2 text-sm">
                    <Switch checked={onlyOpen} onCheckedChange={setOnlyOpen} />
                    {t("management.questions.filterOpen")}
                </label>
            }
        />
    );
};
