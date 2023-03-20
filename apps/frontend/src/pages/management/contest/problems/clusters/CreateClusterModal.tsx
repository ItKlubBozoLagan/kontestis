import { zodResolver } from "@hookform/resolvers/zod";
import { Problem } from "@kontestis/models";
import { FC, useEffect } from "react";
import { useForm } from "react-hook-form";
import Modal from "react-modal";
import { useQueryClient } from "react-query";
import { z } from "zod";

import { SimpleButton } from "../../../../../components/SimpleButton";
import { TitledInput } from "../../../../../components/TitledInput";
import { useCreateCluster } from "../../../../../hooks/problem/cluster/useCreateCluster";
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

    const queryClient = useQueryClient();

    useEffect(() => {
        if (!createMutation.isSuccess) return;

        queryClient.invalidateQueries(["clusters", problem.id]);
        createMutation.reset();
        reset();
        properties.onAfterClose?.();
    }, [createMutation.isSuccess]);

    return (
        <Modal
            {...properties}
            shouldCloseOnEsc
            shouldCloseOnOverlayClick
            contentLabel={"Create cluster Modal"}
            style={ModalStyles}
        >
            <div tw={"text-xl"}>
                Create cluster for <span tw={"font-bold"}>{problem.title}</span>
            </div>
            <div tw={"text-sm text-red-500"}>
                {Object.keys(errors).length > 0 && <span>Validation error! Check your input!</span>}
                {createMutation.error && <span>Error! {createMutation.error.message}</span>}
            </div>
            <form onSubmit={onSubmit}>
                <div tw={"flex flex-col items-stretch gap-2"}>
                    <TitledInput
                        bigLabel
                        label={"Awarded score"}
                        tw={"max-w-full"}
                        {...register("awarded_score")}
                    />
                    <SimpleButton tw={"mt-2"}>Create</SimpleButton>
                </div>
            </form>
        </Modal>
    );
};
