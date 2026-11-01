import type { ClusterSubmissionDetails } from "@kontestis/models";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, Download } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { getSubmissionFileUrl, submissionQueries } from "@/api/submissions";
import { VerdictBadge } from "@/components/badges/VerdictBadge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type FileType = "in" | "out" | "sout";

const FileButton = ({
    submissionId,
    clusterId,
    testcaseId,
    type,
    available,
    label,
}: {
    submissionId: bigint;
    clusterId: bigint;
    testcaseId: bigint;
    type: FileType;
    available: boolean;
    label: string;
}) => {
    const [loading, setLoading] = useState(false);

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <span>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        disabled={!available || loading}
                        aria-label={label}
                        onClick={async () => {
                            setLoading(true);

                            try {
                                const { url } = await getSubmissionFileUrl(
                                    submissionId,
                                    clusterId,
                                    testcaseId,
                                    type
                                );

                                window.location.assign(url);
                            } finally {
                                setLoading(false);
                            }
                        }}
                    >
                        <Download />
                    </Button>
                </span>
            </TooltipTrigger>
            <TooltipContent>{label}</TooltipContent>
        </Tooltip>
    );
};

const ClusterRow = ({
    cluster,
    index,
    submissionId,
    canSeeFiles,
}: {
    cluster: ClusterSubmissionDetails;
    index: number;
    submissionId: bigint;
    canSeeFiles: boolean;
}) => {
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);
    const showFiles = canSeeFiles || cluster.is_sample;
    const { data: files = [] } = useQuery({
        ...submissionQueries.files(submissionId, cluster.cluster_id),
        enabled: open && showFiles,
    });

    const testcases = [...cluster.testcases].sort((a, b) =>
        a.testcase_id > b.testcase_id ? 1 : -1
    );

    return (
        <Collapsible open={open} onOpenChange={setOpen} className="border-b last:border-b-0">
            <CollapsibleTrigger className="hover:bg-muted/60 flex w-full items-center gap-3 px-4 py-2.5 text-left font-mono text-[13px]">
                <ChevronRight
                    className={cn(
                        "text-muted-foreground size-4 transition-transform",
                        open && "rotate-90"
                    )}
                />
                <span className="min-w-28 font-sans font-medium">
                    {cluster.is_sample
                        ? t("submissions.body.sampleIndex", { index: index + 1 })
                        : t("submissions.body.clusterIndex", { index: index + 1 })}
                </span>
                <VerdictBadge verdict={cluster.verdict} />
                <span className="text-muted-foreground ml-auto hidden sm:inline">
                    {cluster.time_used_millis} ms
                </span>
                <span className="text-muted-foreground hidden w-20 text-right sm:inline">
                    {cluster.memory_used_megabytes} MiB
                </span>
                <span className="w-32 text-right">
                    {t("submissions.body.points", {
                        score: cluster.awarded_score,
                        max: cluster.max_score,
                    })}
                </span>
            </CollapsibleTrigger>
            <CollapsibleContent>
                <div className="bg-muted/30 border-t px-4 py-2">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent">
                                <TableHead>{t("submissions.table.testcase")}</TableHead>
                                <TableHead>{t("submissions.table.verdict")}</TableHead>
                                <TableHead>{t("submissions.table.time")}</TableHead>
                                <TableHead>{t("submissions.table.memory")}</TableHead>
                                <TableHead>{t("submissions.table.points")}</TableHead>
                                {showFiles && (
                                    <>
                                        <TableHead className="text-center">
                                            {t("submissions.view.input")}
                                        </TableHead>
                                        <TableHead className="text-center">
                                            {t("submissions.view.expected")}
                                        </TableHead>
                                        <TableHead className="text-center">
                                            {t("submissions.view.output")}
                                        </TableHead>
                                    </>
                                )}
                            </TableRow>
                        </TableHeader>
                        <TableBody className="font-mono text-[13px]">
                            {testcases.map((testcase, testcaseIndex) => (
                                <TableRow key={testcase.id.toString()}>
                                    <TableCell className="font-sans">
                                        {t("submissions.body.testcaseIndex", {
                                            index: testcaseIndex + 1,
                                        })}
                                    </TableCell>
                                    <TableCell>
                                        <VerdictBadge verdict={testcase.verdict} />
                                    </TableCell>
                                    <TableCell>{testcase.time_used_millis} ms</TableCell>
                                    <TableCell>{testcase.memory_used_megabytes} MiB</TableCell>
                                    <TableCell>{testcase.awarded_score ?? "?"}</TableCell>
                                    {showFiles &&
                                        (["in", "out", "sout"] as const).map((type) => (
                                            <TableCell key={type} className="text-center">
                                                <FileButton
                                                    submissionId={submissionId}
                                                    clusterId={cluster.cluster_id}
                                                    testcaseId={testcase.testcase_id}
                                                    type={type}
                                                    available={files.includes(
                                                        `${testcase.testcase_id}.${type}`
                                                    )}
                                                    label={
                                                        type === "in"
                                                            ? t("submissions.view.input")
                                                            : type === "out"
                                                            ? t("submissions.view.expected")
                                                            : t("submissions.view.output")
                                                    }
                                                />
                                            </TableCell>
                                        ))}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CollapsibleContent>
        </Collapsible>
    );
};

/** Expandable cluster → testcase results of a submission, samples listed separately. */
export const ClusterResults = ({
    title,
    clusters,
    submissionId,
    canSeeFiles,
}: {
    title: string;
    clusters: ClusterSubmissionDetails[];
    submissionId: bigint;
    canSeeFiles: boolean;
}) => (
    <section className="bg-card overflow-hidden rounded-md border">
        <header className="bg-muted/70 border-b px-4 py-2 text-base font-medium">{title}</header>
        {clusters.map((cluster, index) => (
            <ClusterRow
                key={cluster.id.toString()}
                cluster={cluster}
                index={index}
                submissionId={submissionId}
                canSeeFiles={canSeeFiles}
            />
        ))}
    </section>
);
