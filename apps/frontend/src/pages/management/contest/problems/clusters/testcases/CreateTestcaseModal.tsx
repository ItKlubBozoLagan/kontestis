import { zodResolver } from "@hookform/resolvers/zod";
import { Cluster } from "@kontestis/models";
import { FC, useEffect } from "react";
import { useForm } from "react-hook-form";
import Modal from "react-modal";
import { useQueryClient } from "react-query";
import { z } from "zod";

import { SimpleButton } from "../../../../../../components/SimpleButton";
import { Translated } from "../../../../../../components/Translated";
import { useCreateTestcase } from "../../../../../../hooks/problem/cluster/testcase/useCreateTestcase";
import { useTranslation } from "../../../../../../hooks/useTranslation";
import { ModalStyles } from "../../../../../../util/ModalStyles";

const CreateTestcaseSchema = z.object({
    input: z.string().min(1),
    correctOutput: z.string().min(1),
});

type Properties = {
    cluster: Cluster;
};

export const CreateTestcaseModal: FC<Modal.Props & Properties> = ({ cluster, ...properties }) => {
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<z.infer<typeof CreateTestcaseSchema>>({
        resolver: zodResolver(CreateTestcaseSchema),
    });

    const createMutation = useCreateTestcase([cluster.problem_id, cluster.id]);

    const onSubmit = handleSubmit((data) => {
        createMutation.reset();

        createMutation.mutate(data);
    });

    const queryClient = useQueryClient();

    useEffect(() => {
        if (!createMutation.isSuccess) return;

        queryClient.invalidateQueries(["testcases", cluster.problem_id, cluster.id]);
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
            contentLabel={"Create testcase Modal"}
            style={ModalStyles}
        >
            <div tw={"text-xl"}>Create testcase</div>
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
                <div tw={"flex flex-col items-stretch gap-2 p-1"}>
                    <span tw={"mt-2"}>
                        {t("contests.management.individual.problems.cluster.testCase.input")}
                    </span>
                    <textarea
                        tw={"w-full h-16 resize-none font-mono text-sm"}
                        {...register("input")}
                    ></textarea>

                    <span tw={"mt-2"}>
                        {t("contests.management.individual.problems.cluster.testCase.output")}
                    </span>
                    <textarea
                        tw={"w-full h-16 resize-none font-mono text-sm"}
                        {...register("correctOutput")}
                    ></textarea>
                    <SimpleButton tw={"mt-2"}>
                        {t(
                            "contests.management.individual.problems.cluster.testCase.modal.CreateButton"
                        )}
                    </SimpleButton>
                </div>
            </form>
        </Modal>
    );
};
