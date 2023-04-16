import { zodResolver } from "@hookform/resolvers/zod";
import { Problem } from "@kontestis/models";
import React, { FC, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import Modal from "react-modal";
import { z } from "zod";

import { SimpleButton } from "../../../../../components/SimpleButton";
import { TitledInput } from "../../../../../components/TitledInput";
import { TitledSwitch } from "../../../../../components/TitledSwitch";
import { Translated } from "../../../../../components/Translated";
import { useCreateCluster } from "../../../../../hooks/problem/cluster/useCreateCluster";
import { useTranslation } from "../../../../../hooks/useTranslation";
import { ModalStyles } from "../../../../../util/ModalStyles";

const CreateClusterSchema = z.object({
    awarded_score: z.coerce.number(),
    generator: z.coerce.boolean(),
    generator_language: z.string(),
    generator_code: z.string(),
});

type Properties = {
    problem: Problem;
};

export const CreateClusterModal: FC<Modal.Props & Properties> = ({ problem, ...properties }) => {
    const {
        setValue,
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<z.infer<typeof CreateClusterSchema>>({
        resolver: zodResolver(CreateClusterSchema),
        defaultValues: {
            generator: false,
            generator_language: "python",
            generator_code: "",
        },
    });

    const createMutation = useCreateCluster(problem.id);

    const onSubmit = handleSubmit((data) => {
        createMutation.reset();
        createMutation.mutate(data);
    });

    const [generator, setGenerator] = useState(false);

    useEffect(() => {
        if (!createMutation.isSuccess) return;

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
            contentLabel={"Create cluster Modal"}
            style={ModalStyles}
        >
            <div tw={"text-xl"}>
                <Translated translationKey="contests.management.individual.problems.cluster.modal.title">
                    <span tw={"font-bold"}>{problem.title}</span>
                </Translated>
            </div>
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
                <div tw={"flex flex-col items-stretch gap-3"}>
                    <TitledInput
                        bigLabel
                        label={t(
                            "contests.management.individual.problems.cluster.modal.awardedScore"
                        )}
                        tw={"max-w-full"}
                        {...register("awarded_score")}
                    />
                    <TitledSwitch
                        label={t(
                            "contests.management.individual.problems.cluster.info.generator.label"
                        )}
                        choice={[
                            t(
                                "contests.management.individual.problems.cluster.info.generator.plain"
                            ),
                            t(
                                "contests.management.individual.problems.cluster.info.generator.generator"
                            ),
                        ]}
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
                        }}
                    />
                    {generator && (
                        <div>
                            <div tw={"flex flex-col gap-2"}>
                                <span tw={"mt-2"}>
                                    {t(
                                        "contests.management.individual.problems.cluster.info.generator_language"
                                    )}
                                </span>
                                <select
                                    name="languages"
                                    onChange={(event) =>
                                        setValue("generator_language", event.target.value)
                                    }
                                >
                                    <option value="python">Python</option>
                                    <option value="cpp">C++</option>
                                    <option value="c">C</option>
                                    <option value="go">Go</option>
                                    <option value="rust">Rust</option>
                                    <option value="java">Java</option>
                                </select>
                            </div>
                            <span tw={"mt-2"}>
                                {t(
                                    "contests.management.individual.problems.cluster.info.generator_code"
                                )}
                            </span>
                            <textarea
                                tw={"w-full h-32 resize-none font-mono text-sm"}
                                {...register("generator_code")}
                            ></textarea>
                        </div>
                    )}
                    <SimpleButton tw={"mt-2"} disabled={createMutation.isLoading}>
                        {t("contests.management.individual.problems.cluster.modal.createButton")}
                    </SimpleButton>
                </div>
            </form>
        </Modal>
    );
};
