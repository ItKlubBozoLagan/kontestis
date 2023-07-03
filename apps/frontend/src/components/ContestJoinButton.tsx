import { zodResolver } from "@hookform/resolvers/zod";
import { FC, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import Modal from "react-modal";
import { useNavigate } from "react-router";
import { z } from "zod";

import { useJoinContest } from "../hooks/contest/useJoinContest";
import { useTranslation } from "../hooks/useTranslation";
import { useOrganisationStore } from "../state/organisation";
import { ModalStyles } from "../util/ModalStyles";
import { SimpleButton } from "./SimpleButton";
import { TitledInput } from "./TitledInput";

const FormSchema = z.object({
    code: z.string().length(16, { message: "Code must be 16 characters long" }),
});

type FormData = z.infer<typeof FormSchema>;

export const ContestJoinButton: FC = () => {
    const [visible, setVisible] = useState(false);

    const { t } = useTranslation();

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<FormData>({
        resolver: zodResolver(FormSchema),
    });

    const { mutate, data, error, isLoading } = useJoinContest();

    const onSubmit = handleSubmit((data) => {
        mutate({
            join_code: data.code,
        });
    });

    const navigate = useNavigate();
    const { setOrganisationId, setIsSelected, setSkipOrganisationSelect } = useOrganisationStore();

    useEffect(() => {
        if (!data) return;

        setIsSelected(true);
        setOrganisationId(data.organisation_id);
        setSkipOrganisationSelect(false);

        navigate(`/contest/${data.contest_id}`);
    }, [data]);

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
                    <span tw={"text-red-600"}>
                        {error && !isLoading
                            ? "Invalid code"
                            : Object.values(errors).at(0)?.message}
                    </span>
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
