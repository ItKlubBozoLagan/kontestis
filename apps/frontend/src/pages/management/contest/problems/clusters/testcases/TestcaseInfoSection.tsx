import { zodResolver } from "@hookform/resolvers/zod";
import { Snowflake, Testcase } from "@kontestis/models";
import React, { FC, useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { FiDownload, FiUpload, FiX } from "react-icons/all";
import { z } from "zod";

import { http, wrapAxios } from "../../../../../../api/http";
import { EditableDisplayBox } from "../../../../../../components/EditableDisplayBox";
import { SimpleButton } from "../../../../../../components/SimpleButton";
import { TitledInput } from "../../../../../../components/TitledInput";
import { TitledSection } from "../../../../../../components/TitledSection";
import { TitledSwitch } from "../../../../../../components/TitledSwitch";
import { useModifyTestcase } from "../../../../../../hooks/problem/cluster/testcase/useCreateTestcase";
import { useAllGenerators } from "../../../../../../hooks/problem/generator/useAllGenerators";
import { useTranslation } from "../../../../../../hooks/useTranslation";
import { downloadFile } from "../../../../../../util/download";
import { TestcaseStatusSection } from "./TestcaseStatusSection";

type Properties = {
    problemId: Snowflake;
    testcase: Testcase;
};

const ModifyTestcaseSchema = z.object({
    input_type: z.enum(["manual", "generator"]),
    output_type: z.enum(["auto", "manual", "ai"]),
    generator_input: z.string().optional(),
    generator_id: z.string().optional(),
});

export const TestcaseInfoSection: FC<Properties> = ({ problemId, testcase }) => {
    const {
        register,
        setValue,
        handleSubmit,
        formState: { errors },
    } = useForm<z.infer<typeof ModifyTestcaseSchema>>({
        resolver: zodResolver(ModifyTestcaseSchema),
        defaultValues: {
            input_type: testcase.input_type,
            output_type: testcase.output_type,
            generator_input: testcase.generator_input ?? "",
            generator_id: testcase.generator_id?.toString() ?? "",
        },
    });

    const { data: generators } = useAllGenerators([problemId]);
    const modifyMutation = useModifyTestcase([problemId, testcase.cluster_id, testcase.id]);
    const [uploadingInput, setUploadingInput] = useState(false);
    const [uploadingOutput, setUploadingOutput] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);

    const inputFileReference = useRef<HTMLInputElement>(null);
    const outputFileReference = useRef<HTMLInputElement>(null);

    const formReference = useRef<HTMLFormElement>(null);

    const submitForm = () => {
        formReference.current?.dispatchEvent(
            new Event("submit", { cancelable: true, bubbles: true })
        );
    };

    const { t } = useTranslation();

    const generator = generators?.find((g) => g.id === testcase.generator_id);

    const onSubmit = handleSubmit((data) => {
        modifyMutation.mutate(data);
    });

    const downloadTestcaseFile = useCallback(
        async (type: "input" | "output") => {
            const { url } = await wrapAxios<{ url: string }>(
                http.get(
                    `/problem/${problemId}/cluster/${testcase.cluster_id}/testcase/${testcase.id}/file/${type}`
                )
            );

            await downloadFile(url);
        },
        [problemId, testcase.cluster_id, testcase.id]
    );

    const handleFileUpload = async (type: "input" | "output", file: File) => {
        const setUploading = type === "input" ? setUploadingInput : setUploadingOutput;

        setUploading(true);
        setUploadError(null);

        try {
            const formData = new FormData();

            formData.append("input", file);

            await http.post(
                `/problem/${problemId}/cluster/${testcase.cluster_id}/testcase/${testcase.id}/${type}`,
                formData,
                {
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                }
            );

            // Refresh testcase data
            window.location.reload();
        } catch (error: any) {
            setUploadError(error.message || "Upload failed");
        } finally {
            setUploading(false);
        }
    };

    const triggerFileInput = (type: "input" | "output") => {
        if (type === "input") {
            inputFileReference.current?.click();
        } else {
            outputFileReference.current?.click();
        }
    };

    useEffect(() => {
        if (testcase) {
            setValue("input_type", testcase.input_type);
            setValue("output_type", testcase.output_type);
            setValue("generator_input", testcase.generator_input ?? "");
            setValue("generator_id", testcase.generator_id?.toString() ?? "");
        }
    }, [testcase, setValue]);

    return (
        <div tw={"w-full flex flex-col gap-4"}>
            <form onSubmit={onSubmit} ref={formReference}>
                <TitledSection
                    title={t("contests.management.individual.problems.cluster.testCase.info")}
                >
                    <TestcaseStatusSection testcase={testcase} />

                    <EditableDisplayBox
                        title="Input Type"
                        value={testcase.input_type}
                        submitFunction={submitForm}
                    >
                        <TitledSwitch
                            label=""
                            choice={["Manual", "Generator"]}
                            defaultIndex={testcase.input_type === "generator" ? 1 : 0}
                            onChange={(value) => {
                                const newType = value === "Generator" ? "generator" : "manual";

                                setValue("input_type", newType);
                            }}
                        />
                    </EditableDisplayBox>

                    <EditableDisplayBox
                        title="Output Type"
                        value={testcase.output_type}
                        submitFunction={submitForm}
                    >
                        <TitledSwitch
                            label=""
                            choice={["Auto", "Manual", "AI"]}
                            defaultIndex={
                                testcase.output_type === "auto"
                                    ? 0
                                    : testcase.output_type === "manual"
                                    ? 1
                                    : 2
                            }
                            onChange={(value) => {
                                const newType =
                                    value === "Auto"
                                        ? "auto"
                                        : value === "Manual"
                                        ? "manual"
                                        : "ai";

                                setValue("output_type", newType);
                            }}
                        />
                    </EditableDisplayBox>

                    {testcase.input_type === "generator" && (
                        <>
                            <EditableDisplayBox
                                title="Generator"
                                value={generator?.name ?? "Unknown"}
                                submitFunction={submitForm}
                            >
                                <select
                                    {...register("generator_id")}
                                    tw={
                                        "py-1 px-2 bg-neutral-200 border border-solid border-neutral-300 text-base outline-none hover:bg-neutral-300"
                                    }
                                >
                                    <option value="">-- Select a generator --</option>
                                    {(generators ?? []).map((gen) => (
                                        <option key={gen.id.toString()} value={gen.id.toString()}>
                                            {gen.name}
                                        </option>
                                    ))}
                                </select>
                            </EditableDisplayBox>

                            <EditableDisplayBox
                                title="Generator Input"
                                value={testcase.generator_input ?? ""}
                                submitFunction={submitForm}
                            >
                                <TitledInput {...register("generator_input")} />
                            </EditableDisplayBox>
                        </>
                    )}

                    <div tw={"flex flex-col items-start gap-3 mt-4 w-full ml-5"}>
                        <div tw={"flex items-center gap-4 justify-between"}>
                            <div tw={"flex items-center gap-2"}>
                                <span tw={"font-semibold"}>Input File:</span>
                                {testcase.input_file ? (
                                    <FiDownload
                                        size={18}
                                        tw={"hover:cursor-pointer hover:text-blue-400"}
                                        onClick={() => downloadTestcaseFile("input")}
                                    />
                                ) : (
                                    <FiX tw={"text-neutral-500"} size={18} />
                                )}
                            </div>
                            {testcase.input_type === "manual" && (
                                <>
                                    <input
                                        type="file"
                                        ref={inputFileReference}
                                        style={{ display: "none" }}
                                        onChange={(event) => {
                                            const file = event.target.files?.[0];

                                            if (file) handleFileUpload("input", file);
                                        }}
                                    />
                                    <SimpleButton
                                        type="button"
                                        prependIcon={FiUpload}
                                        onClick={() => triggerFileInput("input")}
                                        disabled={uploadingInput}
                                    >
                                        {uploadingInput ? "Uploading..." : "Upload Input"}
                                    </SimpleButton>
                                </>
                            )}
                        </div>

                        <div tw={"flex items-center gap-4 justify-between"}>
                            <div tw={"flex items-center gap-2"}>
                                <span tw={"font-semibold"}>Output File:</span>
                                {testcase.output_file ? (
                                    <FiDownload
                                        size={18}
                                        tw={"hover:cursor-pointer hover:text-blue-400"}
                                        onClick={() => downloadTestcaseFile("output")}
                                    />
                                ) : (
                                    <FiX tw={"text-neutral-500"} size={18} />
                                )}
                            </div>
                            {testcase.output_type === "manual" && (
                                <div tw={"flex gap-2"}>
                                    <input
                                        type="file"
                                        ref={outputFileReference}
                                        style={{ display: "none" }}
                                        onChange={(event) => {
                                            const file = event.target.files?.[0];

                                            if (file) handleFileUpload("output", file);
                                        }}
                                    />
                                    <SimpleButton
                                        type="button"
                                        prependIcon={FiUpload}
                                        onClick={() => triggerFileInput("output")}
                                        disabled={uploadingOutput}
                                    >
                                        {uploadingOutput ? "Uploading..." : "Upload Output"}
                                    </SimpleButton>
                                </div>
                            )}
                        </div>
                    </div>

                    {uploadError && (
                        <div tw={"text-sm text-red-500 mt-2"}>Upload Error: {uploadError}</div>
                    )}
                </TitledSection>
                <div tw={"text-sm text-red-500"}>
                    {Object.keys(errors).length > 0 && <span>{t("errorMessages.invalid")}</span>}
                    {modifyMutation.error && <span>Error: {modifyMutation.error.message}</span>}
                </div>
            </form>
        </div>
    );
};
