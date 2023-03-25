import { zodResolver } from "@hookform/resolvers/zod";
import { FC, useEffect } from "react";
import { useForm } from "react-hook-form";
import Modal from "react-modal";
import { useQueryClient } from "react-query";
import { z } from "zod";

import { SimpleButton } from "../../components/SimpleButton";
import { TitledInput } from "../../components/TitledInput";
import { useCreateOrganisation } from "../../hooks/organisation/useCreateOrganisation";
import { ModalStyles } from "../../util/ModalStyles";

const CreateOrganisationSchema = z.object({
    name: z.string().min(1),
});

export const CreateOrganisationModal: FC<Modal.Props> = ({ ...properties }) => {
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<z.infer<typeof CreateOrganisationSchema>>({
        resolver: zodResolver(CreateOrganisationSchema),
    });

    const createMutation = useCreateOrganisation();

    const onSubmit = handleSubmit((data) => {
        createMutation.reset();
        createMutation.mutate(data);
    });

    const queryClient = useQueryClient();

    useEffect(() => {
        if (!createMutation.isSuccess) return;

        queryClient.invalidateQueries(["organisations"]);
        createMutation.reset();
        reset();
        properties.onAfterClose?.();
    }, [createMutation.isSuccess]);

    return (
        <Modal
            {...properties}
            shouldCloseOnEsc
            shouldCloseOnOverlayClick
            contentLabel={"Create organisation Modal"}
            style={ModalStyles}
        >
            <div tw={"text-xl"}>Create new organisation</div>
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
