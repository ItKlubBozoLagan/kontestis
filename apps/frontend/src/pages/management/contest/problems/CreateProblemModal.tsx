import { zodResolver } from "@hookform/resolvers/zod";
import { FC, useEffect } from "react";
import { useForm } from "react-hook-form";
import Modal from "react-modal";
import { useQueryClient } from "react-query";
import { z } from "zod";

import { SimpleButton } from "../../../../components/SimpleButton";
import { TitledInput } from "../../../../components/TitledInput";
import { useContestContext } from "../../../../context/constestContext";
import { useCreateProblem } from "../../../../hooks/problem/useCreateProblem";
import { ModalStyles } from "../../../../util/ModalStyles";

const CreateProblemSchema = z.object({
    name: z.string().min(1),
});

export const CreateContestModal: FC<Modal.Props> = ({ ...properties }) => {
    const { contest } = useContestContext();

    const {
        register,
        handleSubmit,
        setValue,
        setError,
        reset,
        formState: { errors },
    } = useForm<z.infer<typeof CreateProblemSchema>>({
        resolver: zodResolver(CreateProblemSchema),
    });

    const createMutation = useCreateProblem(contest.id);

    const queryClient = useQueryClient();

    const onSubmit = handleSubmit((data) => {
        createMutation.reset();

        createMutation.mutate(data);
    });

    useEffect(() => {
        if (!createMutation.isSuccess) return;

        queryClient.invalidateQueries(["contests"]);
        createMutation.reset();
        reset();
        properties.onAfterClose?.();
    }, [createMutation.isSuccess]);

    return (
        <Modal
            {...properties}
            shouldCloseOnEsc
            shouldCloseOnOverlayClick
            contentLabel={"Create problem Modal"}
            style={ModalStyles}
        >
            <div tw={"text-xl"}>Create problem for {contest.name}</div>
            <div tw={"text-sm text-red-500"}>
                {Object.keys(errors).length > 0 && <span>Validation error! Check your input!</span>}
                {createMutation.error && <span>Error! {createMutation.error.message}</span>}
            </div>
            <form onSubmit={onSubmit}>
                <div tw={"flex flex-col items-stretch gap-2"}>
                    <TitledInput bigLabel label={"Name"} tw={"max-w-full"} {...register("name")} />
                    <SimpleButton tw={"mt-2"}>Create</SimpleButton>
                </div>
            </form>
        </Modal>
    );
};
