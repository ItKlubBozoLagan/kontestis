import { FC, useEffect, useState } from "react";
import { FiList } from "react-icons/all";
import { useParams } from "react-router";
import { Link } from "react-router-dom";

import { http, wrapAxios } from "../../api/http";
import {
    Table,
    TableHeadItem,
    TableHeadRow,
    TableItem,
    TableRow,
} from "../../components/Table";
import { useContest } from "../../hooks/contest/useContest";
import { ProblemType } from "../../types/ProblemType";

type Properties = {
    contest_id: string;
};

export const Contest: FC = () => {
    const { contest_id } = useParams<Properties>();

    const { isSuccess, data: contest } = useContest(BigInt(contest_id ?? 0n));
    const [problems, setProblems] = useState<ProblemType[]>([]);

    useEffect(() => {
        if (!isSuccess) return;

        // TODO: react query
        wrapAxios<ProblemType[]>(
            http.get("/problem", { params: { contest_id: contest.id } })
        ).then(setProblems);
    }, [isSuccess, contest]);

    if (!contest) return <div>Loading...</div>;

    return (
        <div tw={"w-full flex flex-col justify-start items-center gap-4 mt-5"}>
            <div tw={"text-neutral-800 text-3xl"}>{contest.name}</div>
            <Table tw={"w-full"}>
                <thead>
                    <TableHeadRow>
                        <TableHeadItem>Problem</TableHeadItem>
                    </TableHeadRow>
                </thead>
                <tbody>
                    {problems?.map((p) => (
                        <TableRow key={p.id + ""}>
                            <TableItem
                                tw={"hover:(text-sky-800 cursor-pointer)"}
                            >
                                <Link
                                    to={"/problem/" + p.id}
                                    tw={"flex items-center gap-2"}
                                >
                                    <FiList tw={"text-xl"} /> {p.title}
                                </Link>
                            </TableItem>
                        </TableRow>
                    ))}
                </tbody>
            </Table>
        </div>
    );
};
