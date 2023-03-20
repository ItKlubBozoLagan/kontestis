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
    title: z.string().min(1),
    description: z.string().min(1),
    evaluation_script: z.string(),
    time_limit_millis: z.coerce.number(),
    memory_limit_megabytes: z.coerce.number(),
});

export const CreateProblemModal: FC<Modal.Props> = ({ ...properties }) => {
    const { contest } = useContestContext();

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<z.infer<typeof CreateProblemSchema>>({
        resolver: zodResolver(CreateProblemSchema),
    });

    const createMutation = useCreateProblem(contest.id);

    const queryClient = useQueryClient();

    const onSubmit = handleSubmit((data) => {
        createMutation.reset();

        createMutation.mutate({
            ...data,
            evaluation_script:
                data.evaluation_script.trim().length > 0 ? data.evaluation_script : undefined,
            evaluation_variant: data.evaluation_script.trim().length > 0 ? "script" : "plain",
        });
    });

    useEffect(() => {
        console.log(errors);
    }, [errors]);

    useEffect(() => {
        if (!createMutation.isSuccess) return;

        queryClient.invalidateQueries(["contests", contest.id, "problems"]);
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
            <div tw={"text-xl"}>
                Create problem for <span tw={"font-bold"}>{contest.name}</span>
            </div>
            <div tw={"text-sm text-red-500"}>
                {Object.keys(errors).length > 0 && <span>Validation error! Check your input!</span>}
                {createMutation.error && <span>Error! {createMutation.error.message}</span>}
            </div>
            <form onSubmit={onSubmit}>
                <div tw={"flex flex-col items-stretch gap-2 p-1"}>
                    <TitledInput bigLabel label={"Name"} tw={"max-w-full"} {...register("title")} />
                    <span tw={"mt-2"}>Description</span>
                    <textarea
                        tw={"w-full h-32 resize-none font-mono text-sm"}
                        {...register("description")}
                    ></textarea>
                    <div tw={"flex gap-2"}>
                        <TitledInput
                            bigLabel
                            label={"Time limit (ms)"}
                            {...register("time_limit_millis")}
                        />
                        <TitledInput
                            bigLabel
                            label={"Memory limit (MiB)"}
                            {...register("memory_limit_megabytes")}
                        />
                    </div>

                    <span tw={"mt-2"}>Evaluation script (optional)</span>
                    <textarea
                        tw={"w-full h-32 resize-none font-mono text-sm"}
                        {...register("evaluation_script")}
                    ></textarea>
                    <SimpleButton tw={"mt-2"}>Create</SimpleButton>
                </div>
            </form>
        </Modal>
    );
};
