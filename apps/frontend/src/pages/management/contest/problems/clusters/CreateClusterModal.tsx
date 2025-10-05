import { zodResolver } from "@hookform/resolvers/zod";
import { Problem } from "@kontestis/models";
import React, { FC, useEffect } from "react";
import { useForm } from "react-hook-form";
import Modal from "react-modal";
import { z } from "zod";

import { SimpleButton } from "../../../../../components/SimpleButton";
import { TitledInput } from "../../../../../components/TitledInput";
import { Translated } from "../../../../../components/Translated";
import { useCreateCluster } from "../../../../../hooks/problem/cluster/useCreateCluster";
import { useTranslation } from "../../../../../hooks/useTranslation";
import { ModalStyles } from "../../../../../util/ModalStyles";

const CreateClusterSchema = z.object({
    awarded_score: z.coerce.number(),
});

type Properties = {
    problem: Problem;
};

export const CreateClusterModal: FC<Modal.Props & Properties> = ({ problem, ...properties }) => {
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<z.infer<typeof CreateClusterSchema>>({
        resolver: zodResolver(CreateClusterSchema),
    });

    const createMutation = useCreateCluster(problem.id);

    const onSubmit = handleSubmit((data) => {
        createMutation.reset();
        createMutation.mutate(data);
    });

    useEffect(() => {
        if (!createMutation.isSuccess) return;

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
            contentLabel={"Create cluster Modal"}
            style={ModalStyles}
        >
            <div tw={"text-xl"}>
                <Translated translationKey="contests.management.individual.problems.cluster.modal.title">
                    <span tw={"font-bold"}>{problem.title}</span>
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
                <div tw={"flex flex-col items-stretch gap-3"}>
                    <TitledInput
                        bigLabel
                        label={t(
                            "contests.management.individual.problems.cluster.modal.awardedScore"
                        )}
                        tw={"max-w-full"}
                        {...register("awarded_score")}
                    />
                    <SimpleButton tw={"mt-2"} disabled={createMutation.isLoading}>
                        {t("contests.management.individual.problems.cluster.modal.createButton")}
                    </SimpleButton>
                </div>
            </form>
        </Modal>
    );
};
