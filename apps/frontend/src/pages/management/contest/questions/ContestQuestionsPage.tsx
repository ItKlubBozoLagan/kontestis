import { FC } from "react";

import { useContestContext } from "../../../../context/constestContext";
import { useAllContestQuestions } from "../../../../hooks/contest/questions/useAllContestQuestions";
import { ContestQuestionItem } from "./ContestQuestionItem";

export const ContestQuestionsPage: FC = () => {
    const { contest } = useContestContext();

    const { data: questions } = useAllContestQuestions(contest.id);

    return (
        <div tw={"w-full flex justify-center gap-2"}>
            {questions?.length === 0 && <span tw={"w-full text-center"}>None so far</span>}
            <div tw={"flex flex-wrap justify-center gap-4"}>
                {(questions ?? [])
                    .sort((a, b) => Number(a.id - b.id))
                    .map((question) => (
                        <ContestQuestionItem key={question.id.toString()} question={question} />
                    ))}
            </div>
        </div>
    );
};
