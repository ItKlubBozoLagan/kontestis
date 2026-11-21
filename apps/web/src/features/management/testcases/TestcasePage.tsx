import { zodResolver } from "@hookform/resolvers/zod";
import type { Testcase } from "@kontestis/models";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { FileText, Settings2, Trash2 } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { z } from "zod";

import { problemQueries, useDeleteTestcase, useUpdateTestcase } from "@/api/problems";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { Section } from "@/components/common/Section";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { pollingClusters } from "@/features/management/clusters/clusterQueries";
import {
    AuthoringBreadcrumb,
    problemPath,
} from "@/features/management/problems/AuthoringBreadcrumb";
import {
    GenerationError,
    GeneratorStateBadge,
} from "@/features/management/problems/GeneratorStateBadge";
import { TestcaseFileCard } from "@/features/management/testcases/TestcaseFileCard";
import { useManagedContest } from "@/features/management/useManagedContest";
import { useContestAccess } from "@/hooks/useContestAccess";

const schema = z
    .object({
        input_type: z.enum(["manual", "generator"]),
        output_type: z.enum(["auto", "manual"]),
        generator_id: z.string(),
        generator_input: z.string().max(1024),
    })
    .refine((values) => values.input_type === "manual" || values.generator_id.length > 0, {
        path: ["generator_id"],
        message: "Required",
    });

type Values = z.infer<typeof schema>;

const TestcaseSettings = ({
    problemId,
    testcase,
    canEdit,
}: {
    problemId: bigint;
    testcase: Testcase;
    canEdit: boolean;
}) => {
    const { t } = useTranslation();
    const update = useUpdateTestcase(problemId, testcase.cluster_id);
    const { data: generators = [] } = useQuery(problemQueries.generators(problemId));
    const form = useForm<Values>({
        resolver: zodResolver(schema),
        values: {
            input_type: testcase.input_type,
            output_type: testcase.output_type,
            generator_id: testcase.generator_id?.toString() ?? "",
            generator_input: testcase.generator_input ?? "",
        },
    });
    const inputType = useWatch({ control: form.control, name: "input_type" });

    const submit = form.handleSubmit((values) =>
        update
            .mutateAsync({
                testcaseId: testcase.id,
                input_type: values.input_type,
                output_type: values.output_type,
                ...(values.input_type === "generator"
                    ? { generator_id: values.generator_id, generator_input: values.generator_input }
                    : {}),
            })
            .then(() => toast.success(t("managementProblems.testcase.saved")))
    );

    return (
        <Form {...form}>
            <form onSubmit={submit} className="flex flex-col gap-4">
                <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground text-sm">
                        {t("managementProblems.status.label")}
                    </span>
                    <GeneratorStateBadge state={testcase.status} />
                </div>
                {testcase.error && <GenerationError error={testcase.error} />}
                <FormField
                    control={form.control}
                    name="input_type"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t("managementProblems.testcase.inputType")}</FormLabel>
                            <ToggleGroup
                                type="single"
                                variant="outline"
                                disabled={!canEdit}
                                value={field.value}
                                onValueChange={(value) => value && field.onChange(value)}
                            >
                                <ToggleGroupItem value="manual">
                                    {t("managementProblems.types.manual")}
                                </ToggleGroupItem>
                                <ToggleGroupItem value="generator">
                                    {t("managementProblems.types.generator")}
                                </ToggleGroupItem>
                            </ToggleGroup>
                        </FormItem>
                    )}
                />
                {inputType === "generator" && (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <FormField
                            control={form.control}
                            name="generator_id"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        {t("managementProblems.testcase.generator")}
                                    </FormLabel>
                                    <Select
                                        value={field.value}
                                        onValueChange={field.onChange}
                                        disabled={!canEdit}
                                    >
                                        <FormControl>
                                            <SelectTrigger className="w-full">
                                                <SelectValue
                                                    placeholder={t(
                                                        "managementProblems.clusters.dialog.selectGenerator"
                                                    )}
                                                />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {generators.map((generator) => (
                                                <SelectItem
                                                    key={generator.id.toString()}
                                                    value={generator.id.toString()}
                                                >
                                                    {generator.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="generator_input"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        {t("managementProblems.testcase.generatorInput")}
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            className="font-mono"
                                            disabled={!canEdit}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                )}
                <FormField
                    control={form.control}
                    name="output_type"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t("managementProblems.testcase.outputType")}</FormLabel>
                            <ToggleGroup
                                type="single"
                                variant="outline"
                                disabled={!canEdit}
                                value={field.value}
                                onValueChange={(value) => value && field.onChange(value)}
                            >
                                <ToggleGroupItem value="auto">
                                    {t("managementProblems.types.auto")}
                                </ToggleGroupItem>
                                <ToggleGroupItem value="manual">
                                    {t("managementProblems.types.manual")}
                                </ToggleGroupItem>
                            </ToggleGroup>
                        </FormItem>
                    )}
                />
                {canEdit && (
                    <div className="flex justify-end">
                        <Button
                            type="submit"
                            disabled={!form.formState.isDirty || update.isPending}
                        >
                            {t("managementProblems.testcase.save")}
                        </Button>
                    </div>
                )}
            </form>
        </Form>
    );
};

export const TestcasePage = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const contest = useManagedContest();
    const { canEdit } = useContestAccess(contest);
    const {
        problemId = "0",
        clusterId = "0",
        testcaseId = "0",
    } = useParams<{ problemId: string; clusterId: string; testcaseId: string }>();
    const { data: problem } = useSuspenseQuery(problemQueries.detail(problemId));
    const { data: testcase } = useSuspenseQuery({
        ...problemQueries.testcase(problemId, clusterId, testcaseId),
        refetchInterval: (query) => (query.state.data?.status === "pending" ? 1500 : false),
    });
    const { data: clusters = [] } = useQuery(pollingClusters(problemId));
    const { data: siblings = [] } = useQuery(problemQueries.testcases(problemId, clusterId));
    const remove = useDeleteTestcase(problem.id, testcase.cluster_id);

    const clusterIndex = Math.max(
        0,
        clusters.findIndex((it) => it.id === testcase.cluster_id)
    );
    const testcaseIndex = Math.max(
        0,
        [...siblings]
            .sort((a, b) => (a.id < b.id ? -1 : 1))
            .findIndex((it) => it.id === testcase.id)
    );
    const clusterPath = `${problemPath(contest.id, problem.id)}/${testcase.cluster_id}`;

    return (
        <div className="flex w-full flex-col gap-5">
            <AuthoringBreadcrumb
                contestId={contest.id}
                items={[
                    { label: problem.title, to: problemPath(contest.id, problem.id) },
                    {
                        label: t("managementProblems.breadcrumb.cluster", {
                            index: clusterIndex + 1,
                        }),
                        to: clusterPath,
                    },
                    {
                        label: t("managementProblems.breadcrumb.testcase", {
                            index: testcaseIndex + 1,
                        }),
                    },
                ]}
            />
            <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
                    <FileText className="text-muted-foreground size-6" />
                    {t("managementProblems.testcases.name", { index: testcaseIndex + 1 })}
                </h2>
                {canEdit && (
                    <ConfirmDialog
                        trigger={
                            <Button variant="outline" size="sm" className="text-destructive">
                                <Trash2 />
                                {t("managementProblems.testcase.delete")}
                            </Button>
                        }
                        confirmLabel={t("common.delete")}
                        onConfirm={() =>
                            remove.mutateAsync(testcase.id).then(() => {
                                toast.success(t("managementProblems.testcases.deleted"));
                                navigate(clusterPath);
                            })
                        }
                    />
                )}
            </div>
            <Section title={t("managementProblems.testcase.settings")} icon={Settings2}>
                <TestcaseSettings problemId={problem.id} testcase={testcase} canEdit={canEdit} />
            </Section>
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                <TestcaseFileCard
                    problemId={problem.id}
                    testcase={testcase}
                    type="input"
                    canEdit={canEdit}
                />
                <TestcaseFileCard
                    problemId={problem.id}
                    testcase={testcase}
                    type="output"
                    canEdit={canEdit}
                />
            </div>
        </div>
    );
};
