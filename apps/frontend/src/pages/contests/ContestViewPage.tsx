import { zodResolver } from "@hookform/resolvers/zod";
import { FC, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { FiList } from "react-icons/all";
import { useQueryClient } from "react-query";
import { useParams } from "react-router";
import { Link } from "react-router-dom";
import { z } from "zod";

import { ProblemScoreBox } from "../../components/ProblemScoreBox";
import { SimpleButton } from "../../components/SimpleButton";
import { Table, TableHeadItem, TableHeadRow, TableItem, TableRow } from "../../components/Table";
import { TitledInput } from "../../components/TitledInput";
import { TitledSection } from "../../components/TitledSection";
import { useAllContestAnnouncements } from "../../hooks/contest/useAllContestAnnouncements";
import { useAllContestQuestions } from "../../hooks/contest/useAllContestQuestions";
import { useContest } from "../../hooks/contest/useContest";
import { useCreateQuestion } from "../../hooks/contest/useCreateQuestion";
import { useAllProblems } from "../../hooks/problem/useAllProblems";
import { useAllProblemScores } from "../../hooks/problem/useAllProblemScores";
import { Leaderboard } from "./Leaderboard";

type Properties = {
    contestId: string;
};

const QuestionSchema = z.object({
    question: z.string().min(1),
});

export const ContestViewPage: FC = () => {
    const { contestId } = useParams<Properties>();

    const { data: contest } = useContest(BigInt(contestId ?? 0n));
    const { data: problems } = useAllProblems(contest?.id, {
        enabled: !!contest?.id,
    });

    const { data: announcements } = useAllContestAnnouncements(BigInt(contestId ?? 0n));
    const { data: questions } = useAllContestQuestions(BigInt(contestId ?? 0n));

    const [questionsExpanded, setQuestionsExpanded] = useState(false);

    const running = useMemo(() => {
        if (!contest) return false;

        return (
            Date.now() > contest.start_time.getTime() &&
            Date.now() < contest.start_time.getTime() + 1000 * contest.duration_seconds
        );
    }, [contest]);

    const { register, handleSubmit, reset } = useForm<z.infer<typeof QuestionSchema>>({
        resolver: zodResolver(QuestionSchema),
    });

    const createQuestionMutation = useCreateQuestion(contest?.id ?? 0n);
    const queryClient = useQueryClient();

    const onQuestionSubmit = handleSubmit((data) => {
        createQuestionMutation.mutate(data);
    });

    useEffect(() => {
        if (!createQuestionMutation.isSuccess) return;

        queryClient.invalidateQueries(["contests", contest?.id, "questions"]);
        reset();
    }, [createQuestionMutation.isSuccess]);

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
                    <TitledSection title={"Questions"} tw={"flex w-full flex-col gap-4"}>
                        <form onSubmit={onQuestionSubmit} tw={"w-full"}>
                            <div tw={"flex flex-col gap-4 w-full"}>
                                <TitledInput
                                    label={"Ask a question: "}
                                    bigLabel
                                    tw={"w-full max-w-full"}
                                    {...register("question")}
                                ></TitledInput>
                                <SimpleButton>Send</SimpleButton>
                            </div>
                        </form>
                        {(questions ?? [])
                            .sort((a, b) => Number(a.id - b.id))
                            .slice(!questionsExpanded ? -1 : 0)
                            .reverse()
                            .map((question) => (
                                <TitledSection title={question.question} key={question.id + ""}>
                                    {question.response ?? "Waiting for response!"}
                                </TitledSection>
                            ))}
                        <span
                            tw={"text-neutral-800 cursor-pointer"}
                            onClick={() => setQuestionsExpanded((q) => !q)}
                        >
                            {!(questionsExpanded && (questions?.length ?? 0) > 2)
                                ? "Show older"
                                : "Collapse"}
                        </span>
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
