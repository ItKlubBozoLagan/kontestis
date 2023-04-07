import { zodResolver } from "@hookform/resolvers/zod";
import { AdminPermissions, ContestMemberPermissions, ContestQuestion } from "@kontestis/models";
import React, { FC, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useQueryClient } from "react-query";
import { z } from "zod";

import { CanContestMember } from "../../../../components/CanContestMember";
import { EditableDisplayBox } from "../../../../components/EditableDisplayBox";
import { TitledSection } from "../../../../components/TitledSection";
import { useContestContext } from "../../../../context/constestContext";
import { useAnswerQuestion } from "../../../../hooks/contest/questions/useAnswerQuestion";
import { useTranslation } from "../../../../hooks/useTranslation";

type Properties = {
    question: ContestQuestion;
};

const AnswerQuestionSchema = z.object({
    response: z.string().min(1),
});

export const ContestQuestionItem: FC<Properties> = ({ question }) => {
    const { contest, member } = useContestContext();

    const [currentResponse, setCurrentResponse] = useState(question.response);

    const { register, handleSubmit } = useForm<z.infer<typeof AnswerQuestionSchema>>({
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

    const formReference = React.useRef<HTMLFormElement>(null);

    const submitForm = () => {
        formReference.current?.dispatchEvent(
            new Event("submit", { cancelable: true, bubbles: true })
        );
    };

    const { t } = useTranslation();

    // TODO: width part here is terrible, figure out a better way sometime maybe
    return (
        <TitledSection title={question.question} parentStyle={{ maxWidth: "282px" }}>
            <CanContestMember
                member={member}
                permission={ContestMemberPermissions.ANSWER_QUESTIONS}
                adminPermission={AdminPermissions.EDIT_CONTEST}
            >
                <form onSubmit={onSubmit} tw={"w-full"} ref={formReference}>
                    <EditableDisplayBox
                        title={t("contests.management.individual.questions.answerButton")}
                        value={question?.response ?? ""}
                        submitFunction={submitForm}
                        largeTextValue
                        smallTextBox
                    >
                        <textarea {...register("response")} tw={"w-full"} />
                    </EditableDisplayBox>
                </form>
            </CanContestMember>
        </TitledSection>
    );
};
