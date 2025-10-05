import { zodResolver } from "@hookform/resolvers/zod";
import { Cluster } from "@kontestis/models";
import { FC, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import Modal from "react-modal";
import { z } from "zod";

import { SimpleButton } from "../../../../../../components/SimpleButton";
import { TitledInput } from "../../../../../../components/TitledInput";
import { TitledSwitch } from "../../../../../../components/TitledSwitch";
import { Translated } from "../../../../../../components/Translated";
import { useCreateTestcase } from "../../../../../../hooks/problem/cluster/testcase/useCreateTestcase";
import { useAllGenerators } from "../../../../../../hooks/problem/generator/useAllGenerators";
import { useTranslation } from "../../../../../../hooks/useTranslation";
import { ModalStyles } from "../../../../../../util/ModalStyles";

const CreateTestcaseSchema = z.object({
    input_type: z.enum(["manual", "generator"]),
    output_type: z.enum(["auto", "manual"]),
    generator_id: z.string().optional(),
    generator_input: z.string().optional(),
});

type Properties = {
    cluster: Cluster;
};

export const CreateTestcaseModal: FC<Modal.Props & Properties> = ({ cluster, ...properties }) => {
    const {
        register,
        handleSubmit,
        reset,
        setValue,
        watch,
        formState: { errors },
    } = useForm<z.infer<typeof CreateTestcaseSchema>>({
        resolver: zodResolver(CreateTestcaseSchema),
        defaultValues: {
            input_type: "manual",
            output_type: "auto",
        },
    });

    const { data: generators } = useAllGenerators([cluster.problem_id]);
    const [useGenerator, setUseGenerator] = useState(false);

    const createMutation = useCreateTestcase([cluster.problem_id, cluster.id]);

    const onSubmit = handleSubmit((data) => {
        createMutation.reset();

        if (data.input_type === "generator") {
            // Pass all required fields for generator-based testcases
            createMutation.mutate({
                input_type: "generator",
                output_type: data.output_type,
                generator_id: data.generator_id!,
                generator_input: data.generator_input!,
            });
        } else {
            // For manual testcases, just pass the input_type
            createMutation.mutate({
                input_type: "manual",
            });
        }
    });

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
            contentLabel={"Create testcase Modal"}
            style={ModalStyles}
        >
            <div tw={"text-xl"}>Create testcase</div>
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
                    <TitledSwitch
                        label="Input Type"
                        choice={["Manual", "Generator"]}
                        onChange={(value) => {
                            const isGenerator = value === "Generator";

                            setUseGenerator(isGenerator);
                            setValue("input_type", isGenerator ? "generator" : "manual");
                        }}
                    />

                    {useGenerator && (
                        <>
                            <div tw={"flex flex-col gap-2"}>
                                <label>Select Generator</label>
                                <select {...register("generator_id")} tw={"border p-2 rounded"}>
                                    <option value="">-- Select a generator --</option>
                                    {(generators ?? []).map((gen) => (
                                        <option key={gen.id.toString()} value={gen.id.toString()}>
                                            {gen.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <TitledInput
                                bigLabel
                                label="Generator Input"
                                tw={"max-w-full"}
                                placeholder="Input passed to generator (e.g., test number)"
                                {...register("generator_input")}
                            />
                            <TitledSwitch
                                label="Output Type"
                                choice={["Auto", "Manual"]}
                                onChange={(value) => {
                                    setValue("output_type", value === "Auto" ? "auto" : "manual");
                                }}
                            />
                        </>
                    )}

                    <SimpleButton tw={"mt-2"}>
                        {t(
                            "contests.management.individual.problems.cluster.testCase.modal.CreateButton"
                        )}
                    </SimpleButton>
                </div>
            </form>
        </Modal>
    );
};
