import { zodResolver } from "@hookform/resolvers/zod";
import { ClusterWithStatus } from "@kontestis/models";
import React, { FC, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useQueryClient } from "react-query";
import { z } from "zod";

import { EditableDisplayBox } from "../../../../../components/EditableDisplayBox";
import { TitledInput } from "../../../../../components/TitledInput";
import { TitledSection } from "../../../../../components/TitledSection";
import { TitledSwitch } from "../../../../../components/TitledSwitch";
import { Translated } from "../../../../../components/Translated";
import { useModifyCluster } from "../../../../../hooks/problem/cluster/useCreateCluster";
import { useTranslation } from "../../../../../hooks/useTranslation";
import { ClusterStatusSection } from "./ClusterStatusSection";

type Properties = {
    cluster: ClusterWithStatus;
};

const ModifyClusterSchema = z.object({
    awarded_score: z.coerce.number(),
    generator: z.coerce.boolean(),
    generator_language: z.coerce.string(),
    generator_code: z.coerce.string(),
});

export const ClusterInfoSection: FC<Properties> = ({ cluster }) => {
    const {
        setValue,
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<z.infer<typeof ModifyClusterSchema>>({
        resolver: zodResolver(ModifyClusterSchema),
        defaultValues: {
            awarded_score: cluster.awarded_score,
            generator: cluster.generator,
            generator_language: cluster.generator_language,
            generator_code: cluster.generator_code,
        },
    });

    const modifyMutation = useModifyCluster([cluster.problem_id, cluster.id]);

    const onSubmit = handleSubmit((data) => {
        modifyMutation.reset();
        modifyMutation.mutate(data);
    });

    const [generator, setGenerator] = useState(cluster.generator);

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
                <TitledSwitch
                    label={t(
                        "contests.management.individual.problems.cluster.info.generator.label"
                    )}
                    choice={[
                        t("contests.management.individual.problems.cluster.info.generator.plain"),
                        t(
                            "contests.management.individual.problems.cluster.info.generator.generator"
                        ),
                    ]}
                    defaultIndex={cluster.generator ? 1 : 0}
                    onChange={(value) => {
                        setGenerator(
                            value ===
                                t(
                                    "contests.management.individual.problems.cluster.info.generator.generator"
                                )
                        );
                        setValue(
                            "generator",
                            value ===
                                t(
                                    "contests.management.individual.problems.cluster.info.generator.generator"
                                )
                        );

                        if (
                            (value ===
                                t(
                                    "contests.management.individual.problems.cluster.info.generator.generator"
                                )) !==
                            cluster.generator
                        )
                            submitForm();
                    }}
                />
                {generator && (
                    <div tw={"w-full flex flex-col gap-5 mt-5"}>
                        <ClusterStatusSection cluster={cluster} />
                        <EditableDisplayBox
                            title={t(
                                "contests.management.individual.problems.cluster.info.generator_language"
                            )}
                            value={cluster.generator_language + ""}
                            submitFunction={submitForm}
                        >
                            <select
                                name="languages"
                                onChange={(event) =>
                                    setValue("generator_language", event.target.value)
                                }
                                defaultValue={cluster.generator_language ?? ""}
                            >
                                <option value="python">Python</option>
                                <option value="cpp">C++</option>
                                <option value="c">C</option>
                            </select>
                        </EditableDisplayBox>
                        <EditableDisplayBox
                            title={t(
                                "contests.management.individual.problems.cluster.info.generator_code"
                            )}
                            value={cluster.generator_code ?? ""}
                            submitFunction={submitForm}
                            largeTextValue
                        >
                            <textarea {...register("generator_code")} />
                        </EditableDisplayBox>
                    </div>
                )}
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
