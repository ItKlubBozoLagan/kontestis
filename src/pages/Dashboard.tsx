import { useEffect, useState } from "react";
import { FC } from "react";

import { http, wrapAxios } from "../api/http";
import { Header } from "../components/Header";
import {
    Table,
    TableHeadItem,
    TableHeadRow,
    TableItem,
    TableRow,
} from "../components/Table";
import { useAllContests } from "../hooks/contest/useAllContests";
import { useAllSubmissions } from "../hooks/submission/useAllSubmissions";
import { useAuthStore } from "../state/auth";
import { ProblemType } from "../types/ProblemType";

export const Dashboard: FC = () => {
    const { user } = useAuthStore();

    const [totalProblems, setTotalProblems] = useState(0);

    const { isSuccess: isContestsSuccess, data: contests } = useAllContests();
    const { data: submissions } = useAllSubmissions(user.id);

    useEffect(() => {
        if (!isContestsSuccess) return;

        // TODO: utilize with react query
        // TODO 2: maybe fix backend so we don't make O(n) requests
        for (const contest of contests) {
            wrapAxios<ProblemType[]>(
                http.get("/problem", { params: { contest_id: contest.id } })
            ).then((problems) => {
                setTotalProblems((previous) => previous + problems.length);
            });
        }
    }, [isContestsSuccess, contests]);

    return (
        <div>
            <Header />
            <Table tw={"w-full"}>
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
