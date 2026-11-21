import { useSuspenseQuery } from "@tanstack/react-query";
import { Trash2, Wand2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";

import { problemQueries, useDeleteGenerator, useUpdateGenerator } from "@/api/problems";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { Section } from "@/components/common/Section";
import { Button } from "@/components/ui/button";
import { GeneratorForm } from "@/features/management/generators/GeneratorForm";
import {
    AuthoringBreadcrumb,
    problemPath,
} from "@/features/management/problems/AuthoringBreadcrumb";
import { useManagedContest } from "@/features/management/useManagedContest";
import { useContestAccess } from "@/hooks/useContestAccess";

export const GeneratorPage = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const contest = useManagedContest();
    const { canEdit } = useContestAccess(contest);
    const { problemId = "0", generatorId = "0" } = useParams<{
        problemId: string;
        generatorId: string;
    }>();
    const { data: problem } = useSuspenseQuery(problemQueries.detail(problemId));
    const { data: generator } = useSuspenseQuery(problemQueries.generator(problemId, generatorId));
    const update = useUpdateGenerator(problem.id, generator.id);
    const remove = useDeleteGenerator(problem.id);
    const generatorsPath = `${problemPath(contest.id, problem.id)}/generators`;

    return (
        <div className="flex w-full flex-col gap-5">
            <AuthoringBreadcrumb
                contestId={contest.id}
                items={[
                    { label: problem.title, to: problemPath(contest.id, problem.id) },
                    { label: t("managementProblems.breadcrumb.generators"), to: generatorsPath },
                    { label: generator.name },
                ]}
            />
            <Section
                title={t("managementProblems.generators.edit")}
                icon={Wand2}
                actions={
                    canEdit && (
                        <ConfirmDialog
                            trigger={
                                <Button variant="outline" size="sm" className="text-destructive">
                                    <Trash2 />
                                    {t("common.delete")}
                                </Button>
                            }
                            description={t("managementProblems.generators.deleteDescription")}
                            confirmLabel={t("common.delete")}
                            onConfirm={() =>
                                remove.mutateAsync(generator.id).then(() => {
                                    toast.success(t("managementProblems.generators.deleted"));
                                    navigate(generatorsPath);
                                })
                            }
                        />
                    )
                }
            >
                <GeneratorForm
                    key={generator.id.toString()}
                    editing
                    defaultValues={{
                        name: generator.name,
                        language: generator.language,
                        code: generator.code,
                    }}
                    submitLabel={t("managementProblems.generators.save")}
                    onSubmit={(values) =>
                        update
                            .mutateAsync(values)
                            .then(() => toast.success(t("managementProblems.generators.saved")))
                    }
                />
            </Section>
        </div>
    );
};
