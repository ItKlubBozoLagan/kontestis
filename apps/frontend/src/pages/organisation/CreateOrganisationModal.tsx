import { zodResolver } from "@hookform/resolvers/zod";
import { FC, useEffect } from "react";
import { useForm } from "react-hook-form";
import Modal from "react-modal";
import { useQueryClient } from "react-query";
import { z } from "zod";

import { SimpleButton } from "../../components/SimpleButton";
import { TitledInput } from "../../components/TitledInput";
import { Translated } from "../../components/Translated";
import { useCreateOrganisation } from "../../hooks/organisation/useCreateOrganisation";
import { useTranslation } from "../../hooks/useTranslation";
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

    const { t } = useTranslation();

    return (
        <Modal
            {...properties}
            shouldCloseOnEsc
            shouldCloseOnOverlayClick
            contentLabel={"Create organisation Modal"}
            style={ModalStyles}
        >
            <div tw={"text-xl"}>{t("ogranisations.page.modal.title")}</div>
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
                        label={t("ogranisations.page.modal.name")}
                        tw={"max-w-full"}
                        {...register("name")}
                    />
                    <SimpleButton tw={"mt-2"}>
                        {t("ogranisations.page.modal.createButton")}
                    </SimpleButton>
                </div>
            </form>
        </Modal>
    );
};
