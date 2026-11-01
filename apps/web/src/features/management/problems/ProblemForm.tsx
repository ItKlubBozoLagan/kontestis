import { zodResolver } from "@hookform/resolvers/zod";
import type { EvaluationLanguage, EvaluationVariant } from "@kontestis/models";
import { useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";

import type { ProblemFormValues } from "@/api/problems";
import { CodeEditor } from "@/components/code/CodeEditor";
import { Markdown } from "@/components/common/Markdown";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { LanguageSelect } from "@/features/management/problems/LanguageSelect";
import { TagInput } from "@/features/management/problems/TagInput";
import { cn } from "@/lib/utils";

export const VARIANTS: EvaluationVariant[] = ["plain", "checker", "interactive", "output-only"];

const LANGUAGES = [
    "c",
    "cpp",
    "python",
    "java",
    "go",
    "rust",
    "gnu_asm_x86_linux",
    "ocaml",
    "output-only",
] as const;

// a checker reading `<separator> input <separator> expected output <separator> submission output`
export const DEFAULT_CHECKER = `def read_until(separator):
    out = ""
    while True:
        line = input()
        if line == separator:
            return out
        out += " " + line.strip()


while True:
    separator = input()
    if len(separator.strip()) > 0:
        break

read_until(separator)
out = read_until(separator)
subOut = read_until(separator)

print("AC" if out.strip() == subOut.strip() else "WA")
`;

const schema = z
    .object({
        title: z.string().trim().min(1),
        description: z.string().min(1),
        time_limit_millis: z.number().int().min(50).max(10_000),
        memory_limit_megabytes: z.number().int().min(32).max(10_240),
        evaluation_variant: z.enum(["plain", "checker", "interactive", "output-only"]),
        evaluation_language: z.enum(LANGUAGES),
        evaluation_script: z.string(),
        solution_language: z.enum(LANGUAGES),
        solution_code: z.string(),
        tags: z.array(z.string()),
    })
    .refine(
        (values) =>
            values.evaluation_variant === "plain" || values.evaluation_script.trim().length > 0,
        {
            path: ["evaluation_script"],
            message: "Required",
        }
    );

type Values = z.infer<typeof schema>;

export const emptyProblem = (): Values => ({
    title: "",
    description: "",
    time_limit_millis: 1000,
    memory_limit_megabytes: 256,
    evaluation_variant: "plain",
    evaluation_language: "python",
    evaluation_script: DEFAULT_CHECKER,
    solution_language: "python",
    solution_code: "",
    tags: [],
});

export const problemToValues = (
    problem: Partial<ProblemFormValues> & { title: string; description: string }
): Values => ({
    ...emptyProblem(),
    ...problem,
    evaluation_language: (problem.evaluation_language ?? "python") as Values["evaluation_language"],
    solution_language: (problem.solution_language ?? "python") as Values["solution_language"],
    evaluation_script: problem.evaluation_script ?? "",
    solution_code: problem.solution_code ?? "",
    tags: [...(problem.tags ?? [])].sort(),
});

const toPayload = (values: Values): ProblemFormValues => ({
    ...values,
    evaluation_language: values.evaluation_language as EvaluationLanguage,
    solution_language: values.solution_language as EvaluationLanguage,
});

type Props = {
    defaultValues: Values;
    onSubmit: (values: ProblemFormValues) => Promise<unknown>;
    submitLabel: string;
    /** Render the footer with discard button & "unsaved changes" hint (edit mode). */
    editing?: boolean;
    className?: string;
};

export const ProblemForm = ({
    defaultValues,
    onSubmit,
    submitLabel,
    editing = false,
    className,
}: Props) => {
    const { t } = useTranslation();
    const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues });
    const [variant, description, solutionLanguage, evaluationLanguage] = useWatch({
        control: form.control,
        name: ["evaluation_variant", "description", "solution_language", "evaluation_language"],
    });

    const submit = form.handleSubmit(async (values) => {
        await onSubmit(toPayload(values));
        form.reset(values);
    });

    return (
        <Form {...form}>
            <form onSubmit={submit} className={cn("flex flex-col gap-5", className)}>
                <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t("managementProblems.form.title")}</FormLabel>
                            <FormControl>
                                <Input {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t("managementProblems.form.description")}</FormLabel>
                            <Tabs defaultValue="write">
                                <TabsList>
                                    <TabsTrigger value="write">
                                        {t("managementProblems.form.write")}
                                    </TabsTrigger>
                                    <TabsTrigger value="preview">
                                        {t("managementProblems.form.preview")}
                                    </TabsTrigger>
                                </TabsList>
                                <TabsContent value="write">
                                    <FormControl>
                                        <Textarea
                                            className="max-h-[32rem] min-h-64 font-mono text-sm"
                                            {...field}
                                        />
                                    </FormControl>
                                </TabsContent>
                                <TabsContent value="preview">
                                    <div className="max-h-[32rem] min-h-64 overflow-y-auto rounded-md border p-4">
                                        {description.trim() ? (
                                            <Markdown>{description}</Markdown>
                                        ) : (
                                            <span className="text-muted-foreground text-sm">
                                                {t("managementProblems.form.emptyPreview")}
                                            </span>
                                        )}
                                    </div>
                                </TabsContent>
                            </Tabs>
                            <FormDescription>
                                {t("managementProblems.form.descriptionHint")}
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <FormField
                        control={form.control}
                        name="time_limit_millis"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t("managementProblems.form.timeLimit")}</FormLabel>
                                <FormControl>
                                    <Input
                                        type="number"
                                        min={50}
                                        max={10_000}
                                        {...field}
                                        value={Number.isNaN(field.value) ? "" : field.value}
                                        onChange={(event) =>
                                            field.onChange(event.target.valueAsNumber)
                                        }
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="memory_limit_megabytes"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t("managementProblems.form.memoryLimit")}</FormLabel>
                                <FormControl>
                                    <Input
                                        type="number"
                                        min={32}
                                        max={10_240}
                                        {...field}
                                        value={Number.isNaN(field.value) ? "" : field.value}
                                        onChange={(event) =>
                                            field.onChange(event.target.valueAsNumber)
                                        }
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                <FormField
                    control={form.control}
                    name="evaluation_variant"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t("managementProblems.form.evaluationVariant")}</FormLabel>
                            <FormControl>
                                <RadioGroup
                                    value={field.value}
                                    onValueChange={field.onChange}
                                    className="grid grid-cols-1 gap-2 sm:grid-cols-2"
                                >
                                    {VARIANTS.map((option) => (
                                        <label
                                            key={option}
                                            htmlFor={`variant-${option}`}
                                            className={cn(
                                                "hover:bg-muted flex cursor-pointer items-start gap-2.5 rounded-md border p-3",
                                                field.value === option && "border-primary bg-accent"
                                            )}
                                        >
                                            <RadioGroupItem
                                                id={`variant-${option}`}
                                                value={option}
                                                className="mt-0.5"
                                            />
                                            <span className="flex flex-col gap-0.5">
                                                <span className="text-sm font-medium">
                                                    {t(`evaluationVariants.${option}`)}
                                                </span>
                                                <span className="text-muted-foreground text-xs">
                                                    {t(
                                                        `managementProblems.form.variantHints.${option}`
                                                    )}
                                                </span>
                                            </span>
                                        </label>
                                    ))}
                                </RadioGroup>
                            </FormControl>
                        </FormItem>
                    )}
                />
                {variant !== "plain" && (
                    <div className="flex flex-col gap-3 rounded-md border p-3">
                        <FormField
                            control={form.control}
                            name="evaluation_language"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        {t("managementProblems.form.evaluationLanguage")}
                                    </FormLabel>
                                    <LanguageSelect
                                        value={field.value as EvaluationLanguage}
                                        onChange={field.onChange}
                                    />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="evaluation_script"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        {t("managementProblems.form.evaluationScript")}
                                    </FormLabel>
                                    <CodeEditor
                                        value={field.value}
                                        onChange={field.onChange}
                                        language={evaluationLanguage as EvaluationLanguage}
                                        minHeight="200px"
                                        maxHeight="480px"
                                    />
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                )}
                <div className="flex flex-col gap-3 rounded-md border p-3">
                    <FormField
                        control={form.control}
                        name="solution_language"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>
                                    {t("managementProblems.form.solutionLanguage")}
                                </FormLabel>
                                <LanguageSelect
                                    value={field.value as EvaluationLanguage}
                                    onChange={field.onChange}
                                    languages={[
                                        "python",
                                        "cpp",
                                        "c",
                                        "java",
                                        "go",
                                        "rust",
                                        "output-only",
                                    ]}
                                />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="solution_code"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t("managementProblems.form.solutionCode")}</FormLabel>
                                <CodeEditor
                                    value={field.value}
                                    onChange={field.onChange}
                                    language={solutionLanguage as EvaluationLanguage}
                                    minHeight="200px"
                                    maxHeight="480px"
                                />
                                <FormDescription>
                                    {t("managementProblems.form.solutionHint")}
                                </FormDescription>
                            </FormItem>
                        )}
                    />
                </div>
                <FormField
                    control={form.control}
                    name="tags"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t("managementProblems.form.tags")}</FormLabel>
                            <TagInput
                                value={field.value}
                                onChange={field.onChange}
                                placeholder={t("managementProblems.form.tagsPlaceholder")}
                            />
                            <FormDescription>
                                {t("managementProblems.form.tagsHint")}
                            </FormDescription>
                        </FormItem>
                    )}
                />
                <div className="bg-background/95 sticky bottom-0 flex items-center justify-end gap-2 border-t py-3">
                    {editing && form.formState.isDirty && (
                        <>
                            <span className="text-muted-foreground mr-auto text-sm">
                                {t("managementProblems.form.unsaved")}
                            </span>
                            <Button type="button" variant="outline" onClick={() => form.reset()}>
                                {t("managementProblems.form.reset")}
                            </Button>
                        </>
                    )}
                    <Button
                        type="submit"
                        disabled={
                            form.formState.isSubmitting || (editing && !form.formState.isDirty)
                        }
                    >
                        {submitLabel}
                    </Button>
                </div>
            </form>
        </Form>
    );
};
