import { zodResolver } from "@hookform/resolvers/zod";
import { Organisation } from "@kontestis/models";
import React, { FC, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useQueryClient } from "react-query";
import { z } from "zod";

import { EditableDisplayBox } from "../../../components/EditableDisplayBox";
import { TitledInput } from "../../../components/TitledInput";
import { TitledSection } from "../../../components/TitledSection";
import { useModifyOrganisation } from "../../../hooks/organisation/useCreateOrganisation";

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

    const queryClient = useQueryClient();

    useEffect(() => {
        if (!modifyMutation.isSuccess) return;

        queryClient.invalidateQueries(["organisations"]);
        queryClient.invalidateQueries(["organisations", organisation.id]);
        modifyMutation.reset();
    }, [modifyMutation.isSuccess]);

    const formReference = React.useRef<HTMLFormElement>(null);

    const submitForm = () => {
        formReference.current?.dispatchEvent(
            new Event("submit", { cancelable: true, bubbles: true })
        );
    };

    return (
        <form onSubmit={onSubmit} ref={formReference}>
            <TitledSection title={"Info"}>
                <EditableDisplayBox
                    title={"Name"}
                    value={organisation.name}
                    submitFunction={submitForm}
                >
                    <TitledInput {...register("name")} />
                </EditableDisplayBox>
                <div tw={"text-sm text-red-500"}>
                    {Object.keys(errors).length > 0 && (
                        <span>Validation error! Check your input!</span>
                    )}
                    {modifyMutation.error && <span>Error! {modifyMutation.error.message}</span>}
                </div>
            </TitledSection>
        </form>
    );
};
