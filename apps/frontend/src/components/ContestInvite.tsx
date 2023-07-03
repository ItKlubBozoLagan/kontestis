import { zodResolver } from "@hookform/resolvers/zod";
import { FC, useState } from "react";
import { useForm } from "react-hook-form";
import Modal from "react-modal";
import { z } from "zod";

import { useTranslation } from "../hooks/useTranslation";
import { ModalStyles } from "../util/ModalStyles";
import { SimpleButton } from "./SimpleButton";
import { TitledInput } from "./TitledInput";

const FormSchema = z.object({
    code: z.string().length(16),
});

type FormData = z.infer<typeof FormSchema>;

export const ContestInvite: FC = () => {
    const [visible, setVisible] = useState(false);

    const { t } = useTranslation();

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<FormData>({
        resolver: zodResolver(FormSchema),
    });

    const onSubmit = handleSubmit((data) => {
        console.log("doing it", data);
    });

    return (
        <>
            <Modal
                isOpen={visible}
                style={ModalStyles}
                shouldCloseOnEsc
                shouldCloseOnOverlayClick
                onRequestClose={() => setVisible(false)}
                onAfterClose={() => setVisible(false)}
            >
                <form onSubmit={onSubmit} tw={"flex flex-col gap-4 items-center"}>
                    <TitledInput
                        label={t("contestJoin.inputTitle")}
                        bigLabel
                        {...register("code")}
                    />
                    <SimpleButton type={"submit"}>{t("contestJoin.submitText")}</SimpleButton>
                </form>
            </Modal>
            <SimpleButton
                disabled={Object.keys(errors).length > 0}
                onClick={() => setVisible(true)}
            >
                {t("contestJoin.buttonText")}
            </SimpleButton>
        </>
    );
};
