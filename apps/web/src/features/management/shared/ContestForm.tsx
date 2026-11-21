import { zodResolver } from "@hookform/resolvers/zod";
import type { Contest } from "@kontestis/models";
import type { ReactNode } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";

import type { ContestFormValues } from "@/api/contests";
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
import { Switch } from "@/components/ui/switch";

/** `Date` -> value of an `<input type="datetime-local">` in the browser's time zone. */
export const toDateTimeLocal = (date: Date) => {
    const offset = date.getTimezoneOffset() * 60_000;

    return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

const MIN_DURATION = 10 * 60;
const MAX_DURATION = 7 * 24 * 60 * 60;

type Props = {
    mode: "create" | "edit";
    contest?: Contest;
    /** official contests need organisation (create) / site (edit) admin rights */
    canSetOfficial: boolean;
    /** exams aren't offered in the default organisation */
    canSetExam: boolean;
    pending: boolean;
    onSubmit: (values: ContestFormValues) => void;
    footer?: ReactNode;
};

export const ContestForm = ({
    mode,
    contest,
    canSetOfficial,
    canSetExam,
    pending,
    onSubmit,
    footer,
}: Props) => {
    const { t } = useTranslation();

    const schema = z
        .object({
            name: z.string().trim().min(1),
            start_time: z.string().min(1),
            hours: z.coerce.number<string | number>().int().min(0),
            minutes: z.coerce.number<string | number>().int().min(0).max(59),
            public: z.boolean(),
            official: z.boolean(),
            exam: z.boolean(),
            show_leaderboard: z.boolean(),
            past_contest: z.boolean(),
        })
        .superRefine((values, context) => {
            const duration = values.hours * 3600 + values.minutes * 60;

            if (duration < MIN_DURATION || duration > MAX_DURATION)
                context.addIssue({
                    code: "custom",
                    path: ["hours"],
                    message: t("management.contestForm.durationError"),
                });

            const start = new Date(values.start_time).getTime();

            if (Number.isNaN(start))
                return context.addIssue({
                    code: "custom",
                    path: ["start_time"],
                    message: t("errors.generic"),
                });

            const changed = !contest || start !== contest.start_time.getTime();

            if (changed && !values.past_contest && start <= Date.now())
                context.addIssue({
                    code: "custom",
                    path: ["start_time"],
                    message: t("management.contestForm.pastError"),
                });
        });

    const form = useForm({
        resolver: zodResolver(schema),
        defaultValues: {
            name: contest?.name ?? "",
            start_time: toDateTimeLocal(
                contest?.start_time ?? new Date(Date.now() + 24 * 3_600_000)
            ),
            hours: contest ? Math.floor(contest.duration_seconds / 3600) : 3,
            minutes: contest ? Math.floor((contest.duration_seconds % 3600) / 60) : 0,
            public: contest?.public ?? false,
            official: contest?.official ?? false,
            exam: contest?.exam ?? false,
            show_leaderboard: contest?.show_leaderboard_during_contest ?? true,
            past_contest: false,
        },
    });

    const submit = form.handleSubmit((values) =>
        onSubmit({
            name: values.name,
            start_time_millis: new Date(values.start_time).getTime(),
            duration_seconds: values.hours * 3600 + values.minutes * 60,
            public: values.public,
            official: values.official,
            exam: values.exam,
            show_leaderboard: values.show_leaderboard,
            ...(mode === "create" ? { past_contest: values.past_contest } : {}),
        })
    );

    const toggles = [
        {
            name: "public",
            label: t("management.contestForm.visibility"),
            hint: t("management.contestForm.visibilityHint"),
            show: true,
        },
        {
            name: "show_leaderboard",
            label: t("management.contestForm.showLeaderboard"),
            hint: t("management.contestForm.showLeaderboardHint"),
            show: true,
        },
        {
            name: "exam",
            label: t("management.contestForm.exam"),
            hint: t("management.contestForm.examHint"),
            show: canSetExam,
        },
        {
            name: "official",
            label: t("management.contestForm.official"),
            hint: t("management.contestForm.officialHint"),
            show: canSetOfficial,
        },
        {
            name: "past_contest",
            label: t("management.contestForm.pastContest"),
            hint: t("management.contestForm.pastContestHint"),
            show: mode === "create",
        },
    ] as const;

    return (
        <Form {...form}>
            <form onSubmit={submit} className="flex flex-col gap-4">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t("management.contestForm.name")}</FormLabel>
                            <FormControl>
                                <Input {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                        control={form.control}
                        name="start_time"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t("management.contestForm.startTime")}</FormLabel>
                                <FormControl>
                                    <Input type="datetime-local" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormItem>
                        <FormLabel>{t("management.contestForm.duration")}</FormLabel>
                        <div className="flex items-center gap-2">
                            <FormField
                                control={form.control}
                                name="hours"
                                render={({ field }) => (
                                    <Input
                                        type="number"
                                        min={0}
                                        className="w-20"
                                        aria-label={t("management.contestForm.hours")}
                                        {...field}
                                        value={field.value as number}
                                    />
                                )}
                            />
                            <span className="text-muted-foreground text-sm">h</span>
                            <FormField
                                control={form.control}
                                name="minutes"
                                render={({ field }) => (
                                    <Input
                                        type="number"
                                        min={0}
                                        max={59}
                                        className="w-20"
                                        aria-label={t("management.contestForm.minutes")}
                                        {...field}
                                        value={field.value as number}
                                    />
                                )}
                            />
                            <span className="text-muted-foreground text-sm">m</span>
                        </div>
                        <p className="text-destructive text-sm">
                            {form.formState.errors.hours?.message}
                        </p>
                    </FormItem>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                    {toggles
                        .filter((toggle) => toggle.show)
                        .map((toggle) => (
                            <FormField
                                key={toggle.name}
                                control={form.control}
                                name={toggle.name}
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-start justify-between gap-3 rounded-md border p-3">
                                        <div className="flex flex-col gap-1">
                                            <FormLabel>{toggle.label}</FormLabel>
                                            <FormDescription className="text-xs">
                                                {toggle.hint}
                                            </FormDescription>
                                        </div>
                                        <FormControl>
                                            <Switch
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                        ))}
                </div>
                <div className="flex items-center justify-end gap-2">
                    {footer}
                    <Button
                        type="submit"
                        disabled={pending || (mode === "edit" && !form.formState.isDirty)}
                    >
                        {mode === "create"
                            ? t("management.contestForm.submitCreate")
                            : t("management.contestForm.submitSave")}
                    </Button>
                </div>
            </form>
        </Form>
    );
};
