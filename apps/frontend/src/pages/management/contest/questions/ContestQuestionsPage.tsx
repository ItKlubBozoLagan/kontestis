import { FC } from "react";

import { useContestContext } from "../../../../context/constestContext";
import { useAllContestQuestions } from "../../../../hooks/contest/questions/useAllContestQuestions";
import { ContestQuestionItem } from "./ContestQuestionItem";

export const ContestQuestionsPage: FC = () => {
    const { contest, member } = useContestContext();

    const { data: questions } = useAllContestQuestions(contest.id);

    return (
        <div tw={"w-full flex gap-2"}>
            {(questions ?? [])
                .sort((a, b) => Number(a.id - b.id))
                .map((question) => (
                    <ContestQuestionItem key={question.id + ""} question={question} />
                ))}
        </div>
    );
};
