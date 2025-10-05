import { zodResolver } from "@hookform/resolvers/zod";
import { Snowflake, Testcase } from "@kontestis/models";
import React, { FC } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { EditableDisplayBox } from "../../../../../../components/EditableDisplayBox";
import { TitledSection } from "../../../../../../components/TitledSection";
import { useAllGenerators } from "../../../../../../hooks/problem/generator/useAllGenerators";
import { useTranslation } from "../../../../../../hooks/useTranslation";

type Properties = {
    problemId: Snowflake;
    testcase: Testcase;
};

const ModifyTestcaseSchema = z.object({
    generator_input: z.string().optional(),
});

export const TestcaseInfoSection: FC<Properties> = ({ problemId, testcase }) => {
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<z.infer<typeof ModifyTestcaseSchema>>({
        resolver: zodResolver(ModifyTestcaseSchema),
        defaultValues: {
            generator_input: testcase.generator_input ?? "",
        },
    });

    const { data: generators } = useAllGenerators([problemId]);

    const formReference = React.useRef<HTMLFormElement>(null);

    const { t } = useTranslation();

    const generator = generators?.find((g) => g.id === testcase.generator_id);

    return (
        <form ref={formReference}>
            <TitledSection
                title={t("contests.management.individual.problems.cluster.testCase.info")}
            >
                <EditableDisplayBox
                    title="Input Type"
                    value={testcase.input_type}
                    submitFunction={() => {}}
                >
                    <span>{testcase.input_type}</span>
                </EditableDisplayBox>
                <EditableDisplayBox
                    title="Output Type"
                    value={testcase.output_type}
                    submitFunction={() => {}}
                >
                    <span>{testcase.output_type}</span>
                </EditableDisplayBox>
                <EditableDisplayBox
                    title="Status"
                    value={testcase.status}
                    submitFunction={() => {}}
                >
                    <span>{testcase.status}</span>
                </EditableDisplayBox>
                {testcase.error && (
                    <EditableDisplayBox
                        title="Error"
                        value={testcase.error}
                        submitFunction={() => {}}
                    >
                        <span tw={"text-red-500"}>{testcase.error}</span>
                    </EditableDisplayBox>
                )}
                {testcase.input_type === "generator" && (
                    <>
                        <EditableDisplayBox
                            title="Generator"
                            value={generator?.name ?? "Unknown"}
                            submitFunction={() => {}}
                        >
                            <span>{generator?.name ?? `ID: ${testcase.generator_id}`}</span>
                        </EditableDisplayBox>
                        <EditableDisplayBox
                            title="Generator Input"
                            value={testcase.generator_input ?? ""}
                            submitFunction={() => {}}
                        >
                            <textarea {...register("generator_input")} readOnly />
                        </EditableDisplayBox>
                    </>
                )}
                {testcase.input_file && (
                    <EditableDisplayBox
                        title="Input File"
                        value="Available"
                        submitFunction={() => {}}
                    >
                        <a
                            href={`/api/problem/${problemId}/cluster/${testcase.cluster_id}/testcase/${testcase.id}/input`}
                            target="_blank"
                            rel="noreferrer"
                            tw={"text-blue-500 hover:underline"}
                        >
                            Download Input
                        </a>
                    </EditableDisplayBox>
                )}
                {testcase.output_file && (
                    <EditableDisplayBox
                        title="Output File"
                        value="Available"
                        submitFunction={() => {}}
                    >
                        <a
                            href={`/api/problem/${problemId}/cluster/${testcase.cluster_id}/testcase/${testcase.id}/output`}
                            target="_blank"
                            rel="noreferrer"
                            tw={"text-blue-500 hover:underline"}
                        >
                            Download Output
                        </a>
                    </EditableDisplayBox>
                )}
            </TitledSection>
            <div tw={"text-sm text-red-500"}>
                {Object.keys(errors).length > 0 && <span>{t("errorMessages.invalid")}</span>}
            </div>
        </form>
    );
};
