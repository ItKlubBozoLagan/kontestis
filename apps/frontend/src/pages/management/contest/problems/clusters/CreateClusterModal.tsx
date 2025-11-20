import { zodResolver } from "@hookform/resolvers/zod";
import { Problem } from "@kontestis/models";
import React, { FC, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import Modal from "react-modal";
import { z } from "zod";

import { SimpleButton } from "../../../../../components/SimpleButton";
import { TitledInput } from "../../../../../components/TitledInput";
import { Translated } from "../../../../../components/Translated";
import { useCreateCluster } from "../../../../../hooks/problem/cluster/useCreateCluster";
import { useAllGenerators } from "../../../../../hooks/problem/generator/useAllGenerators";
import { useTranslation } from "../../../../../hooks/useTranslation";
import { ModalStyles } from "../../../../../util/ModalStyles";

const CreateClusterSchema = z.object({
    awarded_score: z.coerce.number(),
    generator_id: z.string().optional(),
    test_count: z
        .union([z.coerce.number().min(1).max(100), z.string().length(0), z.undefined()])
        .optional(),
    is_sample: z.boolean().optional(),
});

type Properties = {
    problem: Problem;
};

export const CreateClusterModal: FC<Modal.Props & Properties> = ({ problem, ...properties }) => {
    const {
        register,
        handleSubmit,
        reset,
        watch,
        setValue,
        formState: { errors },
    } = useForm<z.infer<typeof CreateClusterSchema>>({
        resolver: zodResolver(CreateClusterSchema),
    });

    const createMutation = useCreateCluster(problem.id);
    const { data: generators } = useAllGenerators([problem.id]);
    const [useGenerator, setUseGenerator] = useState(false);

    const generatorId = watch("generator_id");

    const testCount = watch("test_count");

    const onSubmit = handleSubmit((data) => {
        createMutation.reset();
        createMutation.mutate({
            awarded_score: data.awarded_score,
            is_sample: data.is_sample,
            ...(useGenerator && data.generator_id && data.test_count
                ? {
                      generator_id: data.generator_id,
                      test_count: data.test_count as number,
                  }
                : {}),
        });
    });

    useEffect(() => {
        if (!createMutation.isSuccess) return;

        createMutation.reset();
        reset();
        setUseGenerator(false);
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
                    <div tw={"flex items-center gap-2"}>
                        <input type="checkbox" {...register("is_sample")} />
                        <label>
                            {t("contests.management.individual.problems.cluster.modal.isSample")}
                        </label>
                    </div>

                    <div tw={"flex items-center gap-2"}>
                        <input
                            type="checkbox"
                            id="use-generator"
                            checked={useGenerator}
                            onChange={(event) => {
                                setUseGenerator(event.target.checked);

                                if (!event.target.checked) {
                                    // Clear fields when unchecking
                                    setValue("generator_id", "");
                                    // eslint-disable-next-line unicorn/no-useless-undefined
                                    setValue("test_count", undefined);
                                }
                            }}
                        />
                        <label htmlFor="use-generator">Auto-create testcases with generator</label>
                    </div>

                    {useGenerator && (
                        <>
                            <div>
                                <label htmlFor="generator-select">Select Generator</label>
                                <select
                                    id="generator-select"
                                    tw={"w-full p-2 border rounded"}
                                    {...register("generator_id")}
                                >
                                    <option value="">-- Select Generator --</option>
                                    {generators?.map((generator) => (
                                        <option
                                            key={generator.id.toString()}
                                            value={generator.id.toString()}
                                        >
                                            {generator.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <TitledInput
                                bigLabel
                                type="number"
                                label="Number of Testcases"
                                placeholder="Enter number of testcases (1-100)"
                                tw={"max-w-full"}
                                {...register("test_count")}
                            />

                            {generatorId && testCount && (
                                <div tw={"text-sm text-gray-600 p-2 bg-gray-100 rounded"}>
                                    Will create {testCount} testcase(s) with inputs: 1, 2, 3, ...{" "}
                                    {testCount}
                                </div>
                            )}
                        </>
                    )}

                    <SimpleButton tw={"mt-2"} disabled={createMutation.isLoading}>
                        {t("contests.management.individual.problems.cluster.modal.createButton")}
                    </SimpleButton>
                </div>
            </form>
        </Modal>
    );
};
