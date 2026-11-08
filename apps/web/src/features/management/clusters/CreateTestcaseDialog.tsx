import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { z } from "zod";

import { problemQueries, useCreateTestcase } from "@/api/problems";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

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
    })
    .refine(
        (values) => values.input_type === "manual" || values.generator_input.trim().length > 0,
        {
            path: ["generator_input"],
            message: "Required",
        }
    );

type Values = z.infer<typeof schema>;

export const CreateTestcaseDialog = ({
    problemId,
    clusterId,
    nextIndex,
    basePath,
}: {
    problemId: bigint;
    clusterId: bigint;
    nextIndex: number;
    basePath: string;
}) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const create = useCreateTestcase(problemId, clusterId);
    const { data: generators = [] } = useQuery({
        ...problemQueries.generators(problemId),
        enabled: open,
    });
    const form = useForm<Values>({
        resolver: zodResolver(schema),
        defaultValues: {
            input_type: "manual",
            output_type: "auto",
            generator_id: "",
            generator_input: String(nextIndex),
        },
    });
    const inputType = useWatch({ control: form.control, name: "input_type" });

    const submit = form.handleSubmit((values) =>
        create
            .mutateAsync(
                values.input_type === "generator"
                    ? {
                          generator_id: values.generator_id,
                          generator_input: values.generator_input,
                          output_type: values.output_type,
                      }
                    : undefined
            )
            .then((testcase) => {
                toast.success(t("managementProblems.testcases.dialog.created"));
                setOpen(false);
                form.reset();

                // manual testcases need their files uploaded next
                if (values.input_type === "manual") navigate(`${basePath}/${testcase.id}`);
            })
    );

    return (
        <Dialog
            open={open}
            onOpenChange={(next) => {
                setOpen(next);

                if (next) form.setValue("generator_input", String(nextIndex));
            }}
        >
            <DialogTrigger asChild>
                <Button size="sm">
                    <Plus />
                    {t("managementProblems.testcases.create")}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{t("managementProblems.testcases.dialog.title")}</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={submit} className="flex flex-col gap-4">
                        <FormField
                            control={form.control}
                            name="input_type"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        {t("managementProblems.testcases.dialog.inputType")}
                                    </FormLabel>
                                    <ToggleGroup
                                        type="single"
                                        variant="outline"
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
                                    {field.value === "manual" && (
                                        <FormDescription>
                                            {t("managementProblems.testcases.dialog.manualHint")}
                                        </FormDescription>
                                    )}
                                </FormItem>
                            )}
                        />
                        {inputType === "generator" && (
                            <>
                                <FormField
                                    control={form.control}
                                    name="generator_id"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                {t("managementProblems.testcase.generator")}
                                            </FormLabel>
                                            {generators.length === 0 ? (
                                                <p className="text-muted-foreground text-sm">
                                                    {t(
                                                        "managementProblems.clusters.dialog.noGenerators"
                                                    )}
                                                </p>
                                            ) : (
                                                <Select
                                                    value={field.value}
                                                    onValueChange={field.onChange}
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
                                            )}
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
                                                {t(
                                                    "managementProblems.testcases.dialog.generatorInput"
                                                )}
                                            </FormLabel>
                                            <FormControl>
                                                <Input className="font-mono" {...field} />
                                            </FormControl>
                                            <FormDescription>
                                                {t(
                                                    "managementProblems.testcases.dialog.generatorInputHint"
                                                )}
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="output_type"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                {t(
                                                    "managementProblems.testcases.dialog.outputType"
                                                )}
                                            </FormLabel>
                                            <ToggleGroup
                                                type="single"
                                                variant="outline"
                                                value={field.value}
                                                onValueChange={(value) =>
                                                    value && field.onChange(value)
                                                }
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
                            </>
                        )}
                        <DialogFooter>
                            <Button type="submit" disabled={create.isPending}>
                                {t("managementProblems.testcases.dialog.create")}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};
