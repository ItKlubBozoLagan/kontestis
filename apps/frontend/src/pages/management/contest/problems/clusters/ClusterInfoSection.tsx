import { zodResolver } from "@hookform/resolvers/zod";
import { ClusterWithStatus } from "@kontestis/models";
import React, { FC, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { EditableDisplayBox } from "../../../../../components/EditableDisplayBox";
import { TitledInput } from "../../../../../components/TitledInput";
import { TitledSection } from "../../../../../components/TitledSection";
import { Translated } from "../../../../../components/Translated";
import { useModifyCluster } from "../../../../../hooks/problem/cluster/useCreateCluster";
import { useTranslation } from "../../../../../hooks/useTranslation";
import { ClusterStatusSection } from "./ClusterStatusSection";

type Properties = {
    cluster: ClusterWithStatus;
};

const ModifyClusterSchema = z.object({
    awarded_score: z.coerce.number(),
    order_number: z.coerce.number().optional(),
    is_sample: z.boolean().optional(),
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
            order_number: Number(cluster.order_number),
            is_sample: cluster.is_sample,
        },
    });

    const modifyMutation = useModifyCluster([cluster.problem_id, cluster.id]);

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
            <TitledSection title={t("contests.management.individual.problems.cluster.info.title")}>
                <EditableDisplayBox
                    title={t("contests.management.individual.problems.cluster.info.score")}
                    value={cluster.awarded_score + ""}
                    submitFunction={submitForm}
                >
                    <TitledInput {...register("awarded_score")} />
                </EditableDisplayBox>
                <EditableDisplayBox
                    title="Order"
                    value={cluster.order_number?.toString() ?? "0"}
                    submitFunction={submitForm}
                >
                    <TitledInput {...register("order_number")} />
                </EditableDisplayBox>
                <EditableDisplayBox
                    title={t("contests.management.individual.problems.cluster.info.isSample")}
                    value={cluster.is_sample ? "Yes" : "No"}
                    submitFunction={submitForm}
                >
                    <div tw={"flex items-center gap-2"}>
                        <input type="checkbox" {...register("is_sample")} />
                        <label>
                            {t("contests.management.individual.problems.cluster.info.isSample")}
                        </label>
                    </div>
                </EditableDisplayBox>
                <ClusterStatusSection cluster={cluster} />
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
