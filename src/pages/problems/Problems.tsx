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
import { ContestType } from "../../types/ContestType";
import { ProblemType } from "../../types/ProblemType";

export type Snowflake = bigint;

type ContestProblemList = {
    contest: ContestType;
    problems: ProblemType[];
};

export const Problems: FC = () => {
    const [problems, setProblems] = useState<ContestProblemList[]>([]);

    useEffect(() => {
        wrapAxios<ContestType[]>(http.get("/contest")).then((c) => {
            c.map((contestIndex) =>
                wrapAxios<ProblemType[]>(
                    http.get("/problem", {
                        params: { contest_id: contestIndex.id },
                    })
                ).then((p) => {
                    setProblems([
                        ...problems,
                        { contest: contestIndex, problems: p },
                    ]);
                })
            );
        });
    }, []);

    return (
        <div tw={"w-full flex flex-col"}>
            <PageTitle tw={"w-full"}>Problems:</PageTitle>
            <Table tw={"w-full"}>
                <TableHeadRow>
                    <TableHeadItem>Name</TableHeadItem>
                    <TableHeadItem>Contest Name</TableHeadItem>
                    <TableHeadItem>Added</TableHeadItem>
                </TableHeadRow>
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
            </Table>
        </div>
    );
};
