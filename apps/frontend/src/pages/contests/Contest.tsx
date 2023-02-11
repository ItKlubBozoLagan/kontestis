import { FC } from "react";
import { FiList } from "react-icons/all";
import { useParams } from "react-router";
import { Link } from "react-router-dom";

import { ProblemScoreBox } from "../../components/ProblemScoreBox";
import { Table, TableHeadItem, TableHeadRow, TableItem, TableRow } from "../../components/Table";
import { useContest } from "../../hooks/contest/useContest";
import { useAllProblems } from "../../hooks/problem/useAllProblems";
import { useAllProblemScores } from "../../hooks/problem/useAllProblemScores";
import { Leaderboard } from "./Leaderboard";

type Properties = {
    contest_id: string;
};

export const Contest: FC = () => {
    const { contest_id } = useParams<Properties>();

    const { data: contest } = useContest(BigInt(contest_id ?? 0n));
    const { data: problems } = useAllProblems(contest?.id, {
        enabled: !!contest?.id,
    });

    const problemScores = useAllProblemScores();

    if (!contest) return <div>Loading...</div>;

    return (
        <div tw={"w-full flex flex-col justify-start items-center gap-6 mt-5"}>
            <div tw={"text-neutral-800 text-3xl"}>{contest.name}</div>
            <Table tw={"w-full"}>
                <thead>
                    <TableHeadRow>
                        <TableHeadItem>Problem</TableHeadItem>
                        <TableHeadItem>Score</TableHeadItem>
                    </TableHeadRow>
                </thead>
                <tbody>
                    {problems?.map((p) => (
                        <TableRow key={p.id + ""}>
                            <TableItem tw={"hover:(text-sky-800 cursor-pointer)"}>
                                <Link to={"/problem/" + p.id} tw={"flex items-center gap-2"}>
                                    <FiList tw={"text-xl"} /> {p.title}
                                </Link>
                            </TableItem>
                            <TableItem>
                                <ProblemScoreBox
                                    score={
                                        problemScores.data ? problemScores.data[p.id + ""] ?? 0 : 0
                                    }
                                    maxScore={p.score}
                                />
                            </TableItem>
                        </TableRow>
                    ))}
                </tbody>
            </Table>
            <Leaderboard contest={contest} problems={problems ?? []} />
        </div>
    );
};
