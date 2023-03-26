import { zodResolver } from "@hookform/resolvers/zod";
import { Cluster } from "@kontestis/models";
import { FC, useEffect } from "react";
import { useForm } from "react-hook-form";
import Modal from "react-modal";
import { useQueryClient } from "react-query";
import { z } from "zod";

import { SimpleButton } from "../../../../../../components/SimpleButton";
import { useCreateTestcase } from "../../../../../../hooks/problem/cluster/testcase/useCreateTestcase";
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
                {Object.keys(errors).length > 0 && <span>Validation error! Check your input!</span>}
                {createMutation.error && <span>Error! {createMutation.error.message}</span>}
            </div>
            <form onSubmit={onSubmit}>
                <div tw={"flex flex-col items-stretch gap-2 p-1"}>
                    <span tw={"mt-2"}>Input</span>
                    <textarea
                        tw={"w-full h-16 resize-none font-mono text-sm"}
                        {...register("input")}
                    ></textarea>

                    <span tw={"mt-2"}>Correct output</span>
                    <textarea
                        tw={"w-full h-16 resize-none font-mono text-sm"}
                        {...register("correctOutput")}
                    ></textarea>
                    <SimpleButton tw={"mt-2"}>Create</SimpleButton>
                </div>
            </form>
        </Modal>
    );
};
