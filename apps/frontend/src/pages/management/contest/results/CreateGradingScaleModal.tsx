import { zodResolver } from "@hookform/resolvers/zod";
import { FC, useEffect } from "react";
import { useForm } from "react-hook-form";
import Modal from "react-modal";
import { useQueryClient } from "react-query";
import { z } from "zod";

import { SimpleButton } from "../../../../components/SimpleButton";
import { TitledInput } from "../../../../components/TitledInput";
import { Translated } from "../../../../components/Translated";
import { useContestContext } from "../../../../context/constestContext";
import { useCreateContestGradingScale } from "../../../../hooks/contest/grading/useCreateContestGradingScale";
import { useTranslation } from "../../../../hooks/useTranslation";
import { ModalStyles } from "../../../../util/ModalStyles";

const CreateGradingScaleSchema = z.object({
    percentage: z.coerce.number(),
    grade: z.string().min(1),
});

export const CreateGradingScaleModal: FC<Modal.Props> = ({ ...properties }) => {
    const { contest } = useContestContext();

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<z.infer<typeof CreateGradingScaleSchema>>({
        resolver: zodResolver(CreateGradingScaleSchema),
    });

    const createMutation = useCreateContestGradingScale(contest.id);

    const onSubmit = handleSubmit((data) => {
        createMutation.reset();
        createMutation.mutate(data);
    });

    const queryClient = useQueryClient();

    useEffect(() => {
        if (!createMutation.isSuccess) return;

        queryClient.invalidateQueries(["contest", contest.id, "grades"]);
        createMutation.reset();
        reset();
        properties.onAfterClose?.();
    }, [createMutation.isSuccess]);

    const { t } = useTranslation();

    return (
        <Modal
            {...properties}
            shouldCloseOnEsc
            shouldCloseOnOverlayClick
            contentLabel={"Create grading scale Modal"}
            style={ModalStyles}
        >
            <div tw={"text-xl"}>
                <Translated translationKey="contests.management.individual.results.createModal.title">
                    <span tw={"font-bold"}>{contest.name}</span>
                </Translated>
            </div>
            <div tw={"text-sm text-red-500"}>
                {Object.keys(errors).length > 0 && <span>{t("errorMessages.invalid")}</span>}
                {createMutation.error && (
                    <span>
                        <Translated translationKey="errorMessages.withInfo">
                            {createMutation.error.message}
                        </Translated>
                    </span>
                )}
            </div>
            <form onSubmit={onSubmit}>
                <div tw={"flex flex-col items-stretch gap-2"}>
                    <TitledInput
                        bigLabel
                        label={t("contests.management.individual.results.createModal.percentage")}
                        tw={"max-w-full"}
                        {...register("percentage")}
                    />
                    <TitledInput
                        bigLabel
                        label={t("contests.management.individual.results.createModal.grade")}
                        tw={"max-w-full"}
                        {...register("grade")}
                    />
                    <SimpleButton tw={"mt-2"}>
                        {t("contests.management.individual.results.createModal.createButton")}
                    </SimpleButton>
                </div>
            </form>
        </Modal>
    );
};
