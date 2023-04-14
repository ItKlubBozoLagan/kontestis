import { zodResolver } from "@hookform/resolvers/zod";
import { ExamGradingScale } from "@kontestis/models";
import React, { FC, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { EditableDisplayBox } from "../../../../components/EditableDisplayBox";
import { TitledInput } from "../../../../components/TitledInput";
import { Translated } from "../../../../components/Translated";
import { useContestContext } from "../../../../context/constestContext";
import { useModifyGradingScale } from "../../../../hooks/contest/grading/useCreateContestGradingScale";
import { useTranslation } from "../../../../hooks/useTranslation";

type Properties = {
    gradingScale: ExamGradingScale;
};

const ModifyGradingScaleSchema = z.object({
    percentage: z.coerce.number(),
    grade: z.string().min(1),
});

export const GradingScaleListItem: FC<Properties> = ({ gradingScale }) => {
    const { contest } = useContestContext();

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<z.infer<typeof ModifyGradingScaleSchema>>({
        resolver: zodResolver(ModifyGradingScaleSchema),
        defaultValues: {
            percentage: gradingScale.percentage,
            grade: gradingScale.grade,
        },
    });

    const modifyMutation = useModifyGradingScale([contest.id, gradingScale.id]);

    useEffect(() => {
        if (!modifyMutation.isSuccess) return;

        modifyMutation.reset();
    }, [modifyMutation.isSuccess]);

    const onSubmit = handleSubmit((data) => {
        modifyMutation.reset();
        modifyMutation.mutate(data);
    });

    const formReference = React.useRef<HTMLFormElement>(null);

    const submitForm = () => {
        formReference.current?.dispatchEvent(
            new Event("submit", { cancelable: true, bubbles: true })
        );
    };

    const { t } = useTranslation();

    return (
        <form
            tw={"w-full flex flex-col gap-2 p-2 border-solid border-neutral-200 border-2"}
            onSubmit={onSubmit}
            ref={formReference}
        >
            <div tw={"w-full flex gap-2"}>
                <EditableDisplayBox
                    title={t("contests.management.individual.results.gradingScale.listItem.grade")}
                    value={gradingScale.grade}
                    submitFunction={submitForm}
                >
                    <TitledInput {...register("grade")} />
                </EditableDisplayBox>
                <EditableDisplayBox
                    title={t(
                        "contests.management.individual.results.gradingScale.listItem.percentage"
                    )}
                    value={gradingScale.percentage + "%"}
                    submitFunction={submitForm}
                >
                    <TitledInput {...register("percentage")} />
                </EditableDisplayBox>
            </div>
            {(Object.keys(errors).length > 0 || modifyMutation.error) && (
                <div tw={"text-sm text-red-500"}>
                    {Object.keys(errors).length > 0 && <span>{t("errorMessages.invalid")}</span>}
                    {modifyMutation.error && (
                        <span>
                            <Translated translationKey="errorMessages.withInfo">
                                {modifyMutation.error.message}
                            </Translated>{" "}
                        </span>
                    )}
                </div>
            )}
        </form>
    );
};
