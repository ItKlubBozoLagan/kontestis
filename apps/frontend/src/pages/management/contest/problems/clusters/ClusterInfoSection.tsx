import { zodResolver } from "@hookform/resolvers/zod";
import { Cluster } from "@kontestis/models";
import React, { FC, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useQueryClient } from "react-query";
import { z } from "zod";

import { EditableDisplayBox } from "../../../../../components/EditableDisplayBox";
import { TitledInput } from "../../../../../components/TitledInput";
import { TitledSection } from "../../../../../components/TitledSection";
import { Translated } from "../../../../../components/Translated";
import { useModifyCluster } from "../../../../../hooks/problem/cluster/useCreateCluster";
import { useTranslation } from "../../../../../hooks/useTranslation";

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

    const { t } = useTranslation();

    return (
        <form onSubmit={onSubmit} ref={formReference}>
            <TitledSection title={t("contests.management.individual.problems.cluster.info.title")}>
                <EditableDisplayBox
                    title={t("contests.management.individual.problems.cluster.info.score")}
                    value={cluster.awarded_score + ""}
                    submitFunction={submitForm}
                >
                    <TitledInput {...register("awarded_score")} />
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
