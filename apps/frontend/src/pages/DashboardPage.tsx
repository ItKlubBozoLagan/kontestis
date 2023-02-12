import { Problem } from "@kontestis/models";
import { useMemo } from "react";
import { FC } from "react";
import { useQueries } from "react-query";

import { http, wrapAxios } from "../api/http";
import { Header } from "../components/Header";
import { Table, TableHeadItem, TableHeadRow, TableItem, TableRow } from "../components/Table";
import { useAllContests } from "../hooks/contest/useAllContests";
import { useAllSubmissions } from "../hooks/submission/useAllSubmissions";
import { useAuthStore } from "../state/auth";

export const DashboardPage: FC = () => {
    const { user } = useAuthStore();

    const { data: contests } = useAllContests();
    const { data: submissions } = useAllSubmissions(user.id);
    const problemQueries = useQueries(
        (contests ?? []).map((contest) => ({
            queryKey: ["contest", contest.id, "problem"],
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

    return (
        <div>
            <Header />
            <Table tw={"w-full table-fixed"}>
                <thead>
                    <TableHeadRow>
                        <TableHeadItem>Total Contests</TableHeadItem>
                        <TableHeadItem>Total Problems</TableHeadItem>
                        <TableHeadItem>Total Submissions</TableHeadItem>
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
