import { zodResolver } from "@hookform/resolvers/zod";
import { ContestMemberPermissions, ContestQuestion, hasContestPermission } from "@kontestis/models";
import React, { FC, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useQueryClient } from "react-query";
import { z } from "zod";

import { SimpleButton } from "../../../../components/SimpleButton";
import { TitledInput } from "../../../../components/TitledInput";
import { TitledSection } from "../../../../components/TitledSection";
import { useContestContext } from "../../../../context/constestContext";
import { useAnswerQuestion } from "../../../../hooks/contest/questions/useAnswerQuestion";

type Properties = {
    question: ContestQuestion;
};

const AnswerQuestionSchema = z.object({
    response: z.string().min(1),
});

export const ContestQuestionItem: FC<Properties> = ({ question }) => {
    const { contest, member } = useContestContext();

    const [currentResponse, setCurrentResponse] = useState(question.response);

    const { register, handleSubmit, reset } = useForm<z.infer<typeof AnswerQuestionSchema>>({
        resolver: zodResolver(AnswerQuestionSchema),
        defaultValues: {
            response: currentResponse,
        },
    });

    const queryClient = useQueryClient();

    const answerMutation = useAnswerQuestion([contest.id, question.id]);

    const onSubmit = handleSubmit((data) => {
        answerMutation.reset();

        answerMutation.mutate({
            response: data.response,
        });
        setCurrentResponse(data.response);
    });

    useEffect(() => {
        if (!answerMutation.isSuccess) return;

        queryClient.invalidateQueries(["contests", contest.id, "questions"]);
        answerMutation.reset();
    }, [answerMutation.isSuccess]);

    return (
        <TitledSection small title={question.question}>
            {hasContestPermission(
                member.contest_permissions,
                ContestMemberPermissions.ANSWER_QUESTIONS
            ) && (
                <form onSubmit={onSubmit} tw={"flex flex-col gap-2"}>
                    <TitledInput label={"Answer:"} bigLabel {...register("response")} />
                    <SimpleButton>
                        {currentResponse?.length ?? -1 > 0 ? "Change" : "Answer"}
                    </SimpleButton>
                </form>
            )}
        </TitledSection>
    );
};
