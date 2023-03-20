import { FC, useMemo } from "react";

import { PageTitle } from "../../../../components/PageTitle";
import { useContestContext } from "../../../../context/constestContext";
import { useAllContestQuestions } from "../../../../hooks/contest/questions/useAllContestQuestions";
import { ContestQuestionItem } from "./ContestQuestionItem";

export const ContestQuestionsPage: FC = () => {
    const { contest } = useContestContext();

    const { data: questions } = useAllContestQuestions(contest.id);

    const answered = useMemo(
        () => questions?.filter((q) => (q.response?.length ?? 0) > 0),
        [questions]
    );

    const notAnswered = useMemo(
        () => questions?.filter((q) => (q.response?.length ?? 0) === 0),
        [questions]
    );

    return (
        <div tw={"w-full flex justify-center gap-2"}>
            {questions?.length === 0 && <span tw={"w-full text-center"}>None so far</span>}
            {questions?.length !== 0 && (
                <div tw={"w-full flex flex-col justify-center gap-4"}>
                    <PageTitle>Not answered</PageTitle>
                    {(notAnswered ?? [])
                        .sort((a, b) => Number(a.id - b.id))
                        .map((question) => (
                            <ContestQuestionItem key={question.id.toString()} question={question} />
                        ))}
                    <PageTitle>Answered</PageTitle>
                    {(answered ?? [])
                        .sort((a, b) => Number(b.id - a.id))
                        .map((question) => (
                            <ContestQuestionItem key={question.id.toString()} question={question} />
                        ))}
                </div>
            )}
        </div>
    );
};
