import { zodResolver } from "@hookform/resolvers/zod";
import { Cluster } from "@kontestis/models";
import React, { FC, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useQueryClient } from "react-query";
import { z } from "zod";

import { EditableDisplayBox } from "../../../../../components/EditableDisplayBox";
import { TitledInput } from "../../../../../components/TitledInput";
import { TitledSection } from "../../../../../components/TitledSection";
import { useModifyCluster } from "../../../../../hooks/problem/cluster/useCreateCluster";

type Properties = {
    cluster: Cluster;
};

const ModifyClusterSchema = z.object({
    awarded_score: z.coerce.number(),
});

export const ClusterInfoSection: FC<Properties> = ({ cluster }) => {
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<z.infer<typeof ModifyClusterSchema>>({
        resolver: zodResolver(ModifyClusterSchema),
        defaultValues: {
            awarded_score: cluster.awarded_score,
        },
    });

    const modifyMutation = useModifyCluster([cluster.problem_id, cluster.id]);

    const onSubmit = handleSubmit((data) => {
        console.log("Here");
        modifyMutation.reset();
        modifyMutation.mutate(data);
    });

    const queryClient = useQueryClient();

    useEffect(() => {
        if (!modifyMutation.isSuccess) return;

        queryClient.invalidateQueries(["clusters", cluster.problem_id]);
        queryClient.invalidateQueries(["problem", cluster.problem_id, "cluster", cluster.id]);
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
                    title={"Score"}
                    value={cluster.awarded_score + ""}
                    submitFunction={submitForm}
                >
                    <TitledInput {...register("awarded_score")} />
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
