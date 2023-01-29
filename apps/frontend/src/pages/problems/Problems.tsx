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

export const Problems: FC = () => {
    const [problems, setProblems] = useState<
        (ProblemType & { contest: ContestType })[]
    >([]);

    const { isSuccess: isContestsSuccess, data: contests } = useAllContests();

    useEffect(() => {
        if (!isContestsSuccess) return;

        setProblems([]);

        // TODO: react query
        for (const contest of contests) {
            wrapAxios<ProblemType[]>(
                http.get("/problem", {
                    params: { contest_id: contest.id },
                })
            ).then((response) => {
                setProblems((previous) => [
                    ...previous,
                    ...response.map((problem) => ({ ...problem, contest })),
                ]);
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
                    {problems.map((problem) => (
                        <TableRow key={problem.id + ""}>
                            <TableItem
                                tw={"hover:(text-sky-800 cursor-pointer)"}
                            >
                                <Link
                                    to={"/problem/" + problem.id}
                                    tw={"flex items-center gap-2"}
                                >
                                    <FiList tw={"text-xl"} /> {problem.title}
                                </Link>
                            </TableItem>
                            <TableItem>{problem.contest.name}</TableItem>
                            <TableItem>
                                {problem.contest.start_time.toLocaleString()}
                            </TableItem>
                        </TableRow>
                    ))}
                </tbody>
            </Table>
        </div>
    );
};
