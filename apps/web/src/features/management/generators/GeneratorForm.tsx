import { zodResolver } from "@hookform/resolvers/zod";
import type { EvaluationLanguage } from "@kontestis/models";
import { useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";

import type { GeneratorFormValues } from "@/api/problems";
import { CodeEditor } from "@/components/code/CodeEditor";
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
import { LanguageSelect } from "@/features/management/problems/LanguageSelect";

const schema = z.object({
    name: z.string().trim().min(1).max(255),
    language: z.enum(["python", "cpp", "c", "java", "go", "rust"]),
    code: z.string().min(1),
});

type Values = z.infer<typeof schema>;

export const GENERATOR_TEMPLATE = `import random
import sys

# the generator input (e.g. the testcase number) arrives on stdin
seed = int(sys.stdin.readline())
random.seed(seed)

n = random.randint(1, 10 * seed)
print(n)
print(*[random.randint(1, 1000) for _ in range(n)])
`;

export const GeneratorForm = ({
    defaultValues,
    onSubmit,
    submitLabel,
    editing = false,
}: {
    defaultValues?: GeneratorFormValues;
    onSubmit: (values: GeneratorFormValues) => Promise<unknown>;
    submitLabel: string;
    editing?: boolean;
}) => {
    const { t } = useTranslation();
    const form = useForm<Values>({
        resolver: zodResolver(schema),
        defaultValues: (defaultValues as Values | undefined) ?? {
            name: "",
            language: "python",
            code: GENERATOR_TEMPLATE,
        },
    });
    const language = useWatch({ control: form.control, name: "language" });

    const submit = form.handleSubmit(async (values) => {
        await onSubmit(values as GeneratorFormValues);
        form.reset(values);
    });

    return (
        <Form {...form}>
            <form onSubmit={submit} className="flex flex-col gap-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_auto]">
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t("managementProblems.generators.name")}</FormLabel>
                                <FormControl>
                                    <Input {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="language"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t("managementProblems.generators.language")}</FormLabel>
                                <LanguageSelect value={field.value} onChange={field.onChange} />
                            </FormItem>
                        )}
                    />
                </div>
                <FormField
                    control={form.control}
                    name="code"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t("managementProblems.generators.code")}</FormLabel>
                            <CodeEditor
                                value={field.value}
                                onChange={field.onChange}
                                language={language as EvaluationLanguage}
                                minHeight="320px"
                            />
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <div className="flex items-center justify-end gap-2">
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
