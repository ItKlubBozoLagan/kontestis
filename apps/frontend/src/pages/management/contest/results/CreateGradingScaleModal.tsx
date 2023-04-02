import { zodResolver } from "@hookform/resolvers/zod";
import { FC, useEffect } from "react";
import { useForm } from "react-hook-form";
import Modal from "react-modal";
import { useQueryClient } from "react-query";
import { z } from "zod";

import { SimpleButton } from "../../../../components/SimpleButton";
import { TitledInput } from "../../../../components/TitledInput";
import { useContestContext } from "../../../../context/constestContext";
import { useCreateContestGradingScale } from "../../../../hooks/contest/grading/useCreateContestGradingScale";
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

    return (
        <Modal
            {...properties}
            shouldCloseOnEsc
            shouldCloseOnOverlayClick
            contentLabel={"Create grading scale Modal"}
            style={ModalStyles}
        >
            <div tw={"text-xl"}>
                Create grading scale for <span tw={"font-bold"}>{contest.name}</span>
            </div>
            <div tw={"text-sm text-red-500"}>
                {Object.keys(errors).length > 0 && <span>Validation error! Check your input!</span>}
                {createMutation.error && <span>Error! {createMutation.error.message}</span>}
            </div>
            <form onSubmit={onSubmit}>
                <div tw={"flex flex-col items-stretch gap-2"}>
                    <TitledInput
                        bigLabel
                        label={"Percentage"}
                        tw={"max-w-full"}
                        {...register("percentage")}
                    />
                    <TitledInput
                        bigLabel
                        label={"Grade"}
                        tw={"max-w-full"}
                        {...register("grade")}
                    />
                    <SimpleButton tw={"mt-2"}>Create</SimpleButton>
                </div>
            </form>
        </Modal>
    );
};
