import { Problem } from "@kontestis/models";
import { useMemo } from "react";
import { FC } from "react";
import { useQueries } from "react-query";

import { http, wrapAxios } from "../api/http";
import { Header } from "../components/Header";
import { Table, TableHeadItem, TableHeadRow, TableItem, TableRow } from "../components/Table";
import { useAllContests } from "../hooks/contest/useAllContests";
import { useAllSubmissions } from "../hooks/submission/useAllSubmissions";
import { useTranslation } from "../hooks/useTranslation";
import { useAuthStore } from "../state/auth";

export const DashboardPage: FC = () => {
    const { user } = useAuthStore();

    const { data: contests } = useAllContests();
    const { data: submissions } = useAllSubmissions(user.id);
    const problemQueries = useQueries(
        (contests ?? []).map((contest) => ({
            queryKey: ["contests", contest.id, "problem"],
            queryFn: () =>
                wrapAxios<Problem[]>(http.get("/problem", { params: { contest_id: contest.id } })),
        }))
    );

    const totalProblems = useMemo(
        () =>
            problemQueries.reduce(
                (accumulator, current) => accumulator + (current.data?.length ?? 0),
                0
            ),
        [problemQueries]
    );

    const { t } = useTranslation();

    return (
        <div>
            <Header />
            <Table tw={"w-full table-fixed"}>
                <thead>
                    <TableHeadRow>
                        <TableHeadItem>{t("dashboard.total.contests")}</TableHeadItem>
                        <TableHeadItem>{t("dashboard.total.problems")}</TableHeadItem>
                        <TableHeadItem>{t("dashboard.total.submissions")}</TableHeadItem>
                    </TableHeadRow>
                </thead>
                <tbody>
                    <TableRow>
                        <TableItem>{contests?.length ?? 0}</TableItem>
                        <TableItem>{totalProblems}</TableItem>
                        <TableItem>{submissions?.length ?? 0}</TableItem>
                    </TableRow>
                </tbody>
            </Table>
        </div>
    );
};
