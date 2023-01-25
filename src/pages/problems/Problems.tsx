import React, { FC, useEffect, useState } from "react";
import { FiList } from "react-icons/all";
import { Link } from "react-router-dom";

import { http, wrapAxios } from "../../api/http";
import { PageTitle } from "../../components/PageTitle";
import {
    Table,
    TableHeadItem,
    TableHeadRow,
    TableItem,
    TableRow,
} from "../../components/Table";
import { useAllContests } from "../../hooks/contest/useAllContests";
import { ContestType } from "../../types/ContestType";
import { ProblemType } from "../../types/ProblemType";

type ContestProblemList = {
    contest: ContestType;
    problems: ProblemType[];
};

export const Problems: FC = () => {
    const [problems, setProblems] = useState<ContestProblemList[]>([]);

    const { isSuccess: isContestsSuccess, data: contests } = useAllContests();

    useEffect(() => {
        if (!isContestsSuccess) return;

        for (const contest of contests) {
            wrapAxios<ProblemType[]>(
                http.get("/problem", {
                    params: { contest_id: contest.id },
                })
            ).then((p) => {
                setProblems([...problems, { contest, problems: p }]);
            });
        }
    }, [isContestsSuccess, contests]);

    return (
        <div tw={"w-full flex flex-col"}>
            <PageTitle tw={"w-full"}>Problems:</PageTitle>
            <Table tw={"w-full"}>
                <thead>
                    <TableHeadRow>
                        <TableHeadItem>Name</TableHeadItem>
                        <TableHeadItem>Contest Name</TableHeadItem>
                        <TableHeadItem>Added</TableHeadItem>
                    </TableHeadRow>
                </thead>
                <tbody>
                    {problems.map((p) =>
                        p.problems.map((cp) => (
                            <TableRow key={cp.id + ""}>
                                <TableItem
                                    tw={"hover:(text-sky-800 cursor-pointer)"}
                                >
                                    <Link
                                        to={"/problem/" + cp.id}
                                        tw={"flex items-center gap-2"}
                                    >
                                        <FiList tw={"text-xl"} /> {cp.title}
                                    </Link>
                                </TableItem>
                                <TableItem>{p.contest.name}</TableItem>
                                <TableItem>
                                    {p.contest.start_time.toLocaleString()}
                                </TableItem>
                            </TableRow>
                        ))
                    )}
                </tbody>
            </Table>
        </div>
    );
};
