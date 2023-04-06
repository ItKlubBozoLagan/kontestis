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
import { useAllContestAnnouncements } from "../../hooks/contest/announcements/useAllContestAnnouncements";
import { useAllContestQuestions } from "../../hooks/contest/questions/useAllContestQuestions";
import { useCreateQuestion } from "../../hooks/contest/questions/useCreateQuestion";
import { useContest } from "../../hooks/contest/useContest";
import { useAllProblems } from "../../hooks/problem/useAllProblems";
import { useAllProblemScores } from "../../hooks/problem/useAllProblemScores";
import { useTranslation } from "../../hooks/useTranslation";
import { ContestStatusIndicator } from "../management/contest/overview/ContestStatusIndicator";
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

    const { t } = useTranslation();

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

    if (!contest) return <div>{t("contests.page.loading")}</div>;

    return (
        <div tw={"w-full flex flex-col justify-start items-center gap-6 mt-5"}>
            <div tw={"text-neutral-800 text-3xl"}>{contest.name}</div>
            {contest && <ContestStatusIndicator contest={contest} />}
            {contest && running && (
                <div tw={"w-full flex flex-row justify-between gap-x-3"}>
                    <TitledSection
                        title={t("contests.individual.announcements.label")}
                        tw={"gap-y-0"}
                    >
                        {(announcements ?? []).map((announcement) => (
                            <pre
                                tw={
                                    "w-full text-lg border-solid border-neutral-300 border-[2px] p-2"
                                }
                                key={announcement.id.toString()}
                            >
                                {announcement.message}
                            </pre>
                        ))}
                    </TitledSection>
                    <TitledSection
                        title={t("contests.individual.questions.label") + ":"}
                        tw={"flex w-full flex-col gap-4"}
                    >
                        <form onSubmit={onQuestionSubmit} tw={"w-full"}>
                            <div tw={"flex flex-col gap-4 w-full"}>
                                <TitledInput
                                    label={t("contests.individual.questions.ask")}
                                    bigLabel
                                    tw={"w-full max-w-full"}
                                    {...register("question")}
                                ></TitledInput>
                                <SimpleButton>
                                    {t("contests.individual.questions.sendButton")}
                                </SimpleButton>
                            </div>
                        </form>
                        {(questions ?? [])
                            .sort((a, b) => Number(a.id - b.id))
                            .slice(!questionsExpanded ? -1 : 0)
                            .reverse()
                            .map((question) => (
                                <TitledSection
                                    title={question.question}
                                    key={question.id.toString()}
                                >
                                    <pre>
                                        {question.response ??
                                            t("contests.individual.questions.list.preMessage")}
                                    </pre>
                                </TitledSection>
                            ))}
                        {questions && questions.length > 1 && (
                            <span
                                tw={"text-neutral-800 cursor-pointer"}
                                onClick={() => setQuestionsExpanded((q) => !q)}
                            >
                                {!questionsExpanded
                                    ? t("contests.individual.questions.list.all")
                                    : t("contests.individual.questions.list.collapse")}
                            </span>
                        )}
                    </TitledSection>
                </div>
            )}
            <Table tw={"w-full"}>
                <thead>
                    <TableHeadRow>
                        <TableHeadItem>
                            {contest?.exam
                                ? t("contests.individual.problems_table.examProblem")
                                : t("contests.individual.problems_table.problem")}
                        </TableHeadItem>
                        <TableHeadItem>
                            {t("contests.individual.problems_table.score")}
                        </TableHeadItem>
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
