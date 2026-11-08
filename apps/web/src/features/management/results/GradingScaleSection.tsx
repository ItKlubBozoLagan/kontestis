import type { ExamGradingScale } from "@kontestis/models";
import { Check, GraduationCap, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import {
    useCreateGradingScale,
    useDeleteGradingScale,
    useUpdateGradingScale,
} from "@/api/contests";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { Section } from "@/components/common/Section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const validPercentage = (value: string) =>
    value.trim() !== "" && Number(value) >= 0 && Number(value) <= 100;

const ScaleRow = ({ contestId, scale }: { contestId: bigint; scale: ExamGradingScale }) => {
    const { t } = useTranslation();
    const update = useUpdateGradingScale(contestId);
    const remove = useDeleteGradingScale(contestId);
    const [grade, setGrade] = useState(scale.grade);
    const [percentage, setPercentage] = useState(String(scale.percentage));

    const dirty = grade !== scale.grade || Number(percentage) !== scale.percentage;

    return (
        <form
            className="flex items-center gap-2"
            onSubmit={(event) => {
                event.preventDefault();

                if (!dirty || !grade.trim() || !validPercentage(percentage)) return;

                update.mutate(
                    { id: scale.id, grade: grade.trim(), percentage: Number(percentage) },
                    { onSuccess: () => toast.success(t("management.results.gradingScale.saved")) }
                );
            }}
        >
            <Input
                value={grade}
                onChange={(event) => setGrade(event.target.value)}
                aria-label={t("management.results.gradingScale.grade")}
                className="w-24 font-semibold"
            />
            <div className="relative w-28">
                <Input
                    type="number"
                    min={0}
                    max={100}
                    step="any"
                    value={percentage}
                    onChange={(event) => setPercentage(event.target.value)}
                    aria-label={t("management.results.gradingScale.percentage")}
                    className="pr-7 font-mono"
                />
                <span className="text-muted-foreground absolute top-1/2 right-2.5 -translate-y-1/2 text-sm">
                    %
                </span>
            </div>
            <Button
                type="submit"
                variant="ghost"
                size="icon"
                className="size-8"
                disabled={!dirty || update.isPending}
                aria-label={t("common.save")}
            >
                <Check />
            </Button>
            <ConfirmDialog
                onConfirm={() =>
                    remove.mutateAsync(scale.id, {
                        onSuccess: () =>
                            toast.success(t("management.results.gradingScale.deleted")),
                    })
                }
                trigger={
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-destructive size-8"
                        aria-label={t("common.delete")}
                    >
                        <Trash2 />
                    </Button>
                }
            />
        </form>
    );
};

export const GradingScaleSection = ({
    contestId,
    scales,
}: {
    contestId: bigint;
    scales: ExamGradingScale[];
}) => {
    const { t } = useTranslation();
    const create = useCreateGradingScale(contestId);
    const [grade, setGrade] = useState("");
    const [percentage, setPercentage] = useState("");

    const sorted = [...scales].sort((a, b) => b.percentage - a.percentage);

    return (
        <Section
            title={t("management.results.gradingScale.title")}
            icon={GraduationCap}
            className="h-fit"
        >
            <div className="flex flex-col gap-3">
                <p className="text-muted-foreground text-sm">
                    {t("management.results.gradingScale.description")}
                </p>
                {sorted.length === 0 && (
                    <p className="text-muted-foreground text-sm italic">
                        {t("management.results.gradingScale.empty")}
                    </p>
                )}
                {sorted.map((scale) => (
                    <ScaleRow
                        key={`${scale.id}-${scale.grade}-${scale.percentage}`}
                        contestId={contestId}
                        scale={scale}
                    />
                ))}
                <form
                    className="flex items-center gap-2 border-t pt-3"
                    onSubmit={(event) => {
                        event.preventDefault();

                        if (!grade.trim() || !validPercentage(percentage)) return;

                        create.mutate(
                            { grade: grade.trim(), percentage: Number(percentage) },
                            {
                                onSuccess: () => {
                                    setGrade("");
                                    setPercentage("");
                                },
                            }
                        );
                    }}
                >
                    <Input
                        value={grade}
                        onChange={(event) => setGrade(event.target.value)}
                        placeholder={t("management.results.gradingScale.grade")}
                        className="w-24"
                    />
                    <Input
                        type="number"
                        min={0}
                        max={100}
                        step="any"
                        value={percentage}
                        onChange={(event) => setPercentage(event.target.value)}
                        placeholder={t("management.results.gradingScale.percentage")}
                        className="w-28"
                    />
                    <Button
                        type="submit"
                        size="sm"
                        disabled={create.isPending || !grade.trim() || !validPercentage(percentage)}
                    >
                        <Plus />
                        {t("management.results.gradingScale.add")}
                    </Button>
                </form>
            </div>
        </Section>
    );
};
