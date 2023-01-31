import React, { FC, useMemo } from "react";
import { FiList } from "react-icons/all";
import { useQueries } from "react-query";
import { Link } from "react-router-dom";
import * as R from "remeda";

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
import { ProblemType } from "../../types/ProblemType";

export const Problems: FC = () => {
    const { data: contests } = useAllContests();

    // TODO: extract to hook
    const rawProblems = useQueries(
        (contests ?? []).map((contest) => ({
            queryKey: ["contest", contest.id, "problem"],
            queryFn: () =>
                wrapAxios<ProblemType[]>(
                    http.get("/problem", { params: { contest_id: contest.id } })
                ),
        }))
    );

    const problems = useMemo(
        () =>
            R.pipe(
                rawProblems,
                R.map((it) => it.data),
                R.flatten(),
                R.filter(R.isTruthy),
                R.map((it) => ({
                    ...it,
                    contest: (contests ?? []).find(
                        (contest) =>
                            BigInt(contest.id) === BigInt(it.contest_id)
                    ),
                })),
                R.sort((a, b) => a.title.localeCompare(b.title))
            ),
        [rawProblems]
    );

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
                            <TableItem>{problem.contest?.name}</TableItem>
                            <TableItem>
                                {problem.contest?.start_time.toLocaleString()}
                            </TableItem>
                        </TableRow>
                    ))}
                </tbody>
            </Table>
        </div>
    );
};
