import { FC, useMemo } from "react";

import { useContestContext } from "../../../../context/constestContext";
import { useAllContestQuestions } from "../../../../hooks/contest/questions/useAllContestQuestions";
import { useTranslation } from "../../../../hooks/useTranslation";
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

    const { t } = useTranslation();

    return (
        <div tw={"w-full flex justify-center gap-2"}>
            {questions?.length === 0 && (
                <span tw={"w-full text-center"}>
                    {t("contests.management.individual.questions.empty")}
                </span>
            )}
            {questions?.length !== 0 && (
                <div tw={"w-full flex flex-col justify-center gap-8"}>
                    <div tw={"flex flex-col gap-4"}>
                        <span tw={"text-3xl text-neutral-800"}>
                            {t("contests.management.individual.questions.unAnswered.label")}
                        </span>
                        <div tw={"flex flex-wrap gap-4 justify-center"}>
                            {(notAnswered ?? [])
                                .sort((a, b) => Number(a.id - b.id))
                                .map((question) => (
                                    <ContestQuestionItem
                                        key={question.id.toString()}
                                        question={question}
                                    />
                                ))}
                        </div>
                    </div>
                    <div tw={"flex flex-col gap-4"}>
                        <span tw={"text-3xl text-neutral-800"}>
                            {t("contests.management.individual.questions.answered.label")}
                        </span>
                        <div tw={"flex flex-wrap gap-4 justify-center"}>
                            {(answered ?? [])
                                .sort((a, b) => Number(b.id - a.id))
                                .map((question) => (
                                    <ContestQuestionItem
                                        key={question.id.toString()}
                                        question={question}
                                    />
                                ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
