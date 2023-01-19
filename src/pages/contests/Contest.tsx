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
import { ContestType } from "../../types/ContestType";
import { ProblemType } from "../../types/ProblemType";

type Properties = {
    contest_id: string;
};

export const Contest: FC = () => {
    const { contest_id } = useParams<Properties>();

    const [contest, setContest] = useState<ContestType>();
    const [problems, setProblems] = useState<ProblemType[]>([]);

    useEffect(() => {
        wrapAxios<ContestType>(http.get("/contest/" + contest_id + "/")).then(
            setContest
        );
        wrapAxios<ProblemType[]>(
            http.get("/problem", { params: { contest_id: contest_id } })
        ).then(setProblems);
    }, []);

    return contest ? (
        <div tw={"w-full flex flex-col justify-start items-center gap-4 mt-5"}>
            <div tw={"text-neutral-800 text-3xl"}>{contest.name}</div>
            <Table tw={"w-full"}>
                <TableHeadRow>
                    <TableHeadItem>Problem</TableHeadItem>
                </TableHeadRow>
                {problems.map((p) => (
                    <TableRow key={p.id + ""}>
                        <TableItem tw={"hover:(text-sky-800 cursor-pointer)"}>
                            <Link
                                to={"/problem/" + p.id}
                                tw={"flex items-center gap-2"}
                            >
                                <FiList tw={"text-xl"} /> {p.title}
                            </Link>
                        </TableItem>
                    </TableRow>
                ))}
            </Table>
        </div>
    ) : (
        <div>Loading!</div>
    );
};
