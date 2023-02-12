import { FC, useMemo, useState } from "react";
import { FiList } from "react-icons/all";
import { useParams } from "react-router";
import { Link } from "react-router-dom";

import { http } from "../../api/http";
import { ProblemScoreBox } from "../../components/ProblemScoreBox";
import { SimpleButton } from "../../components/SimpleButton";
import { Table, TableHeadItem, TableHeadRow, TableItem, TableRow } from "../../components/Table";
import { TitledInput } from "../../components/TitledInput";
import { TitledSection } from "../../components/TitledSection";
import { useAllContestAnnouncements } from "../../hooks/contest/useAllContestAnnouncements";
import { useAllContestQuestions } from "../../hooks/contest/useAllContestQuestions";
import { useContest } from "../../hooks/contest/useContest";
import { useAllProblems } from "../../hooks/problem/useAllProblems";
import { useAllProblemScores } from "../../hooks/problem/useAllProblemScores";
import { Leaderboard } from "./Leaderboard";

type Properties = {
    contestId: string;
};

export const ContestViewPage: FC = () => {
    const { contestId } = useParams<Properties>();

    const { data: contest } = useContest(BigInt(contestId ?? 0n));
    const { data: problems } = useAllProblems(contest?.id, {
        enabled: !!contest?.id,
    });

    const { data: announcements } = useAllContestAnnouncements(BigInt(contestId ?? 0n));
    const { data: questions } = useAllContestQuestions(BigInt(contestId ?? 0n));

    const running = useMemo(() => {
        if (!contest) return false;

        return (
            Date.now() > contest.start_time.getTime() &&
            Date.now() < contest.start_time.getTime() + 1000 * contest.duration_seconds
        );
    }, [contest]);

    const [newQuestion, setNewQuestion] = useState("");

    const problemScores = useAllProblemScores();

    if (!contest) return <div>Loading...</div>;

    return (
        <div tw={"w-full flex flex-col justify-start items-center gap-6 mt-5"}>
            <div tw={"text-neutral-800 text-3xl"}>{contest.name}</div>
            {contest && running && (
                <div tw={"w-full flex flex-row justify-between gap-x-3"}>
                    <TitledSection title={"Announcements"}>
                        {(announcements ?? []).map((announcement) => (
                            <span key={announcement.id + ""}>{announcement.message}</span>
                        ))}
                    </TitledSection>
                    <TitledSection title={"Questions"} tw={"flex w-full flex-col"}>
                        {(questions ?? []).map((question) => (
                            <TitledSection title={question.question} key={question.id + ""}>
                                {question.response ?? "Waiting for response!"}
                            </TitledSection>
                        ))}
                        <div tw={"flex flex-col gap-y-2"}>
                            <TitledInput
                                value={newQuestion}
                                name={"Ask a question: "}
                                tw={"w-full"}
                                onChange={(event) => setNewQuestion(event.target.value)}
                            ></TitledInput>
                            <SimpleButton
                                tw={"w-1/3"}
                                onClick={async () => {
                                    await http.post("/contest/question/" + contestId, {
                                        question: newQuestion,
                                    });
                                    setNewQuestion("");
                                }}
                            >
                                Submit
                            </SimpleButton>
                        </div>
                    </TitledSection>
                </div>
            )}
            <Table tw={"w-full"}>
                <thead>
                    <TableHeadRow>
                        <TableHeadItem>Problem</TableHeadItem>
                        <TableHeadItem>Score</TableHeadItem>
                    </TableHeadRow>
                </thead>
                <tbody>
                    {problems?.map((p) => (
                        <TableRow key={p.id.toString()}>
                            <TableItem tw={"hover:(text-sky-800 cursor-pointer)"}>
                                <Link to={"/problem/" + p.id} tw={"flex items-center gap-2"}>
                                    <FiList tw={"text-xl"} /> {p.title}
                                </Link>
                            </TableItem>
                            <TableItem>
                                <ProblemScoreBox
                                    score={
                                        problemScores.data
                                            ? problemScores.data[p.id.toString()] ?? 0
                                            : 0
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
