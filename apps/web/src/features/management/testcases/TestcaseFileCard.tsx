import type { Testcase } from "@kontestis/models";
import { useQuery } from "@tanstack/react-query";
import { Download, FileUp, PenLine, Upload } from "lucide-react";
import { type DragEvent, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { getTestcaseFileUrl, problemQueries, useUploadTestcaseFile } from "@/api/problems";
import { Section } from "@/components/common/Section";
import { Spinner } from "@/components/common/Spinner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const PREVIEW_LIMIT = 4000;

type Props = {
    problemId: bigint;
    testcase: Testcase;
    type: "input" | "output";
    canEdit: boolean;
};

const TestcasePreview = ({
    problemId,
    testcase,
    type,
    file,
    manual,
}: Pick<Props, "problemId" | "testcase" | "type"> & {
    file: string | undefined;
    manual: boolean;
}) => {
    const { t } = useTranslation();
    const query = problemQueries.testcaseData(problemId, testcase.cluster_id, testcase.id, type);
    const { data, isPending, isError } = useQuery({
        ...query,
        // the file name changes on every upload, so it identifies the content
        queryKey: [...query.queryKey, file ?? ""],
        enabled: !!file,
        staleTime: Number.POSITIVE_INFINITY,
    });

    if (!file)
        return (
            <p className="text-muted-foreground text-sm">
                {manual
                    ? t("managementProblems.testcase.noFile")
                    : t("managementProblems.testcase.notAvailable")}
            </p>
        );

    if (isPending) return <Spinner className="mx-auto" />;

    if (isError || data === undefined)
        return (
            <p className="text-muted-foreground text-sm">
                {t("managementProblems.testcase.notAvailable")}
            </p>
        );

    return (
        <div className="flex flex-col gap-1">
            <pre className="bg-muted max-h-80 overflow-auto rounded-md border p-3 font-mono text-xs whitespace-pre">
                {data.slice(0, PREVIEW_LIMIT)}
            </pre>
            {data.length > PREVIEW_LIMIT && (
                <span className="text-muted-foreground text-xs">
                    {t("managementProblems.testcase.previewTruncated", { count: PREVIEW_LIMIT })}
                </span>
            )}
        </div>
    );
};

const UploadHint = ({ type }: { type: Props["type"] }) => {
    const { t } = useTranslation();

    return (
        <p className="text-muted-foreground text-xs">
            {type === "input"
                ? t("managementProblems.testcase.uploadDisabledInput")
                : t("managementProblems.testcase.uploadDisabledOutput")}
        </p>
    );
};

/** Preview, download and upload of one side (input or expected output) of a testcase. */
export const TestcaseFileCard = ({ problemId, testcase, type, canEdit }: Props) => {
    const { t } = useTranslation();
    const fileInput = useRef<HTMLInputElement>(null);
    const [dragging, setDragging] = useState(false);
    const [editing, setEditing] = useState(false);
    const [text, setText] = useState("");
    const upload = useUploadTestcaseFile(problemId, testcase.cluster_id);

    const file = type === "input" ? testcase.input_file : testcase.output_file;
    const manual =
        type === "input" ? testcase.input_type === "manual" : testcase.output_type === "manual";
    const uploadable = canEdit && manual;

    const send = (blob: Blob) =>
        upload.mutate(
            { testcaseId: testcase.id, type, file: blob },
            {
                onSuccess: () => {
                    toast.success(t("managementProblems.testcase.uploaded"));
                    setEditing(false);
                    setText("");
                },
            }
        );

    const onDrop = (event: DragEvent) => {
        event.preventDefault();
        setDragging(false);

        const [dropped] = event.dataTransfer.files;

        if (dropped && uploadable) send(dropped);
    };

    const download = async () => {
        const { url } = await getTestcaseFileUrl(problemId, testcase.cluster_id, testcase.id, type);

        window.location.href = url;
    };

    return (
        <Section
            title={
                type === "input"
                    ? t("managementProblems.testcase.input")
                    : t("managementProblems.testcase.output")
            }
            icon={FileUp}
            actions={
                <>
                    {file && (
                        <Button variant="outline" size="sm" onClick={download}>
                            <Download />
                            {t("common.download")}
                        </Button>
                    )}
                    {uploadable && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditing((value) => !value)}
                        >
                            <PenLine />
                            {editing
                                ? t("common.cancel")
                                : t("managementProblems.testcase.enterText")}
                        </Button>
                    )}
                </>
            }
            contentClassName="flex flex-col gap-3"
        >
            {editing ? (
                <div className="flex flex-col gap-2">
                    <Textarea
                        value={text}
                        onChange={(event) => setText(event.target.value)}
                        className="max-h-96 min-h-40 font-mono text-sm"
                        autoFocus
                    />
                    <Button
                        className="self-end"
                        disabled={upload.isPending}
                        onClick={() => send(new Blob([text], { type: "text/plain" }))}
                    >
                        {t("managementProblems.testcase.submitText")}
                    </Button>
                </div>
            ) : (
                <TestcasePreview
                    problemId={problemId}
                    testcase={testcase}
                    type={type}
                    file={file}
                    manual={manual}
                />
            )}
            {uploadable && !editing && (
                <div
                    onDragOver={(event) => {
                        event.preventDefault();
                        setDragging(true);
                    }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={onDrop}
                    className={cn(
                        "text-muted-foreground flex items-center justify-center gap-2 rounded-md border border-dashed p-4 text-sm",
                        dragging && "border-primary bg-accent"
                    )}
                >
                    {upload.isPending ? (
                        <>
                            <Spinner className="size-4" />
                            {t("managementProblems.testcase.uploading")}
                        </>
                    ) : (
                        <>
                            <Upload className="size-4" />
                            {t("managementProblems.testcase.drop")}
                            <button
                                type="button"
                                className="text-primary hover:underline"
                                onClick={() => fileInput.current?.click()}
                            >
                                {t("managementProblems.testcase.browse")}
                            </button>
                        </>
                    )}
                    <input
                        ref={fileInput}
                        type="file"
                        className="hidden"
                        onChange={(event) => {
                            const selected = event.target.files?.[0];

                            if (selected) send(selected);

                            event.target.value = "";
                        }}
                    />
                </div>
            )}
            {canEdit && !manual && <UploadHint type={type} />}
        </Section>
    );
};
