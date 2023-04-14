import { zodResolver } from "@hookform/resolvers/zod";
import { Organisation } from "@kontestis/models";
import React, { FC, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { EditableDisplayBox } from "../../../components/EditableDisplayBox";
import { TitledInput } from "../../../components/TitledInput";
import { TitledSection } from "../../../components/TitledSection";
import { Translated } from "../../../components/Translated";
import { useModifyOrganisation } from "../../../hooks/organisation/useCreateOrganisation";
import { useTranslation } from "../../../hooks/useTranslation";

type Properties = {
    organisation: Organisation;
};

const ModifyOrganisationSchema = z.object({
    name: z.string().min(1),
});

export const OrganisationInfoSection: FC<Properties> = ({ organisation }) => {
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<z.infer<typeof ModifyOrganisationSchema>>({
        resolver: zodResolver(ModifyOrganisationSchema),
        defaultValues: {
            name: organisation.name,
        },
    });

    const modifyMutation = useModifyOrganisation(organisation.id);

    const onSubmit = handleSubmit((data) => {
        modifyMutation.reset();
        modifyMutation.mutate(data);
    });

    useEffect(() => {
        if (!modifyMutation.isSuccess) return;

        modifyMutation.reset();
    }, [modifyMutation.isSuccess]);

    const formReference = React.useRef<HTMLFormElement>(null);

    const submitForm = () => {
        formReference.current?.dispatchEvent(
            new Event("submit", { cancelable: true, bubbles: true })
        );
    };

    const { t } = useTranslation();

    return (
        <form onSubmit={onSubmit} ref={formReference}>
            <TitledSection title={t("organisations.management.info.title")}>
                <EditableDisplayBox
                    title={t("organisations.management.info.name")}
                    value={organisation.name}
                    submitFunction={submitForm}
                >
                    <TitledInput focusOnLoad {...register("name")} />
                </EditableDisplayBox>
                <div tw={"text-sm text-red-500"}>
                    {Object.keys(errors).length > 0 && <span>{t("errorMessages.invalid")}</span>}
                    {modifyMutation.error && (
                        <span>
                            <Translated translationKey="errorMessages.withInfo">
                                {modifyMutation.error.message}
                            </Translated>
                        </span>
                    )}
                </div>
            </TitledSection>
        </form>
    );
};
