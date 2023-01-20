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
import { useAuthStore } from "../state/auth";
import { ContestType } from "../types/ContestType";
import { ProblemType } from "../types/ProblemType";
import { SubmissionType } from "../types/SubmissionType";

export const Dashboard: FC = () => {
    const { user } = useAuthStore();

    const [totalContests, setTotalCOntests] = useState<number>(0);
    const [totalProblems, setTotalProblems] = useState<number>(0);
    const [totalSubmissions, setTotalSubmissions] = useState<number>(0);

    useEffect(() => {
        wrapAxios<ContestType[]>(http.get("/contests")).then((c) => {
            setTotalCOntests(c.length);
        });

        wrapAxios<ProblemType[]>(http.get("/problems")).then((p) => {
            setTotalProblems(p.length);
        });

        wrapAxios<[SubmissionType[]]>(
            http.get("/submission", {
                params: { user_id: user.id },
            })
        ).then((s) => {
            setTotalSubmissions(s.length);
        });
    }, [user]);

    return (
        <div>
            <Header />
            <Table tw={"w-full"}>
                <TableHeadRow>
                    <TableHeadItem>Total Contests</TableHeadItem>
                    <TableHeadItem>Total Problems</TableHeadItem>
                    <TableHeadItem>Total Submissions</TableHeadItem>
                </TableHeadRow>
                <TableRow>
                    <TableItem>{totalContests}</TableItem>
                    <TableItem>{totalProblems}</TableItem>
                    <TableItem>{totalSubmissions}</TableItem>
                </TableRow>
            </Table>
        </div>
    );
};
