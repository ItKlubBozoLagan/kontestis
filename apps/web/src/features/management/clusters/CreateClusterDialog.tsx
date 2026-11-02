import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { z } from "zod";

import { problemQueries, useCreateCluster } from "@/api/problems";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Dialog,
    DialogContent,
    DialogDescription,
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

const schema = z
    .object({
        awarded_score: z.number().int().min(0).max(1_000_000),
        is_sample: z.boolean(),
        use_generator: z.boolean(),
        generator_id: z.string(),
        test_count: z.number().int().min(1).max(100),
    })
    .refine((values) => !values.use_generator || values.generator_id.length > 0, {
        path: ["generator_id"],
        message: "Required",
    });

type Values = z.infer<typeof schema>;

export const CreateClusterDialog = ({
    problemId,
    problemTitle,
}: {
    problemId: bigint;
    problemTitle: string;
}) => {
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);
    const create = useCreateCluster(problemId);
    const { data: generators = [] } = useQuery({
        ...problemQueries.generators(problemId),
        enabled: open,
    });
    const form = useForm<Values>({
        resolver: zodResolver(schema),
        defaultValues: {
            awarded_score: 10,
            is_sample: false,
            use_generator: false,
            generator_id: "",
            test_count: 10,
        },
    });
    const [isSample, useGenerator, testCount] = useWatch({
        control: form.control,
        name: ["is_sample", "use_generator", "test_count"],
    });

    const submit = form.handleSubmit((values) =>
        create
            .mutateAsync({
                awarded_score: values.is_sample ? 0 : values.awarded_score,
                is_sample: values.is_sample,
                ...(values.use_generator
                    ? { generator_id: values.generator_id, test_count: values.test_count }
                    : {}),
            })
            .then(() => {
                toast.success(t("managementProblems.clusters.dialog.created"));
                setOpen(false);
                form.reset();
            })
    );

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm">
                    <Plus />
                    {t("managementProblems.clusters.create")}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{t("managementProblems.clusters.dialog.title")}</DialogTitle>
                    <DialogDescription>
                        {t("managementProblems.clusters.dialog.description", {
                            problem: problemTitle,
                        })}
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={submit} className="flex flex-col gap-4">
                        <FormField
                            control={form.control}
                            name="is_sample"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-start gap-2.5 rounded-md border p-3">
                                    <FormControl>
                                        <Checkbox
                                            checked={field.value}
                                            onCheckedChange={(value) =>
                                                field.onChange(value === true)
                                            }
                                        />
                                    </FormControl>
                                    <div className="flex flex-col gap-1">
                                        <FormLabel>
                                            {t("managementProblems.clusters.dialog.sample")}
                                        </FormLabel>
                                        <FormDescription>
                                            {t("managementProblems.clusters.dialog.sampleHint")}
                                        </FormDescription>
                                    </div>
                                </FormItem>
                            )}
                        />
                        {!isSample && (
                            <FormField
                                control={form.control}
                                name="awarded_score"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            {t("managementProblems.clusters.dialog.score")}
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                min={0}
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
                        )}
                        <FormField
                            control={form.control}
                            name="use_generator"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center gap-2.5">
                                    <FormControl>
                                        <Checkbox
                                            checked={field.value}
                                            onCheckedChange={(value) =>
                                                field.onChange(value === true)
                                            }
                                        />
                                    </FormControl>
                                    <FormLabel>
                                        {t("managementProblems.clusters.dialog.useGenerator")}
                                    </FormLabel>
                                </FormItem>
                            )}
                        />
                        {useGenerator && (
                            <div className="flex flex-col gap-4 rounded-md border p-3">
                                <FormField
                                    control={form.control}
                                    name="generator_id"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                {t("managementProblems.clusters.dialog.generator")}
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
                                    name="test_count"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                {t("managementProblems.clusters.dialog.testCount")}
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    min={1}
                                                    max={100}
                                                    {...field}
                                                    value={
                                                        Number.isNaN(field.value) ? "" : field.value
                                                    }
                                                    onChange={(event) =>
                                                        field.onChange(event.target.valueAsNumber)
                                                    }
                                                />
                                            </FormControl>
                                            {!Number.isNaN(testCount) && testCount > 0 && (
                                                <FormDescription>
                                                    {t(
                                                        "managementProblems.clusters.dialog.preview",
                                                        { count: testCount }
                                                    )}
                                                </FormDescription>
                                            )}
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        )}
                        <DialogFooter>
                            <Button type="submit" disabled={create.isPending}>
                                {t("managementProblems.clusters.dialog.create")}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};
