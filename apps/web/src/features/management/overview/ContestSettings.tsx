import type { Contest } from "@kontestis/models";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, Copy, KeyRound, RotateCcw, Settings2 } from "lucide-react";
import { type ComponentType, type ReactNode, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { toast } from "sonner";

import { useCurrentUser } from "@/api/auth";
import { useCopyContest, useRotateJoinCode, useUpdateContest } from "@/api/contests";
import { organisationQueries } from "@/api/organisations";
import { CopyButton } from "@/components/common/CopyButton";
import { Section } from "@/components/common/Section";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ContestForm } from "@/features/management/shared/ContestForm";
import { useContestAccess } from "@/hooks/useContestAccess";
import { isAdmin } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { useOrganisationStore } from "@/stores/organisation";

const InviteSection = ({
    contestId,
    joinCode,
    canEdit,
}: {
    contestId: bigint;
    joinCode: string;
    canEdit: boolean;
}) => {
    const { t } = useTranslation();
    const rotate = useRotateJoinCode(contestId);
    const code = rotate.data?.code ?? joinCode;

    return (
        <Section title={t("management.overview.invite.title")} icon={KeyRound}>
            <div className="flex flex-col gap-3">
                <p className="text-muted-foreground text-sm">
                    {t("management.overview.invite.description")}
                </p>
                <div className="flex items-center gap-2">
                    <code className="bg-muted flex-1 rounded-md border px-3 py-2 text-center font-mono text-lg font-semibold tracking-wider select-all">
                        {code}
                    </code>
                    <CopyButton value={code} />
                    {canEdit && (
                        <Button
                            variant="outline"
                            size="icon"
                            className="size-8"
                            disabled={rotate.isPending}
                            title={t("management.overview.invite.rotate")}
                            onClick={() =>
                                rotate.mutate(undefined, {
                                    onSuccess: () =>
                                        toast.success(t("management.overview.invite.rotated")),
                                })
                            }
                        >
                            <RotateCcw className={rotate.isPending ? "animate-spin" : undefined} />
                        </Button>
                    )}
                </div>
            </div>
        </Section>
    );
};

const CloneSection = ({ contestId }: { contestId: bigint }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const select = useOrganisationStore((state) => state.select);
    const currentOrganisation = useOrganisationStore((state) => state.organisationId);
    const { data: organisations = [] } = useQuery(organisationQueries.all());
    const [target, setTarget] = useState(currentOrganisation ?? "1");
    const copy = useCopyContest(contestId);

    return (
        <Section title={t("management.overview.clone.title")} icon={Copy}>
            <div className="flex flex-col gap-3">
                <p className="text-muted-foreground text-sm">
                    {t("management.overview.clone.description")}
                </p>
                <Label className="text-xs">{t("management.overview.clone.organisation")}</Label>
                <div className="flex gap-2">
                    <Select value={target} onValueChange={setTarget}>
                        <SelectTrigger className="min-w-0 flex-1">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {organisations.map((organisation) => (
                                <SelectItem
                                    key={organisation.id.toString()}
                                    value={organisation.id.toString()}
                                >
                                    {organisation.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Button
                        disabled={copy.isPending}
                        onClick={() =>
                            copy.mutate(target, {
                                onSuccess: (contest) => {
                                    toast.success(t("management.overview.clone.done"));
                                    select(target);
                                    navigate(`/management/${contest.id}/overview`);
                                },
                            })
                        }
                    >
                        {t("management.overview.clone.submit")}
                    </Button>
                </div>
            </div>
        </Section>
    );
};

const SettingsForm = ({ contest, canEdit }: { contest: Contest; canEdit: boolean }) => {
    const { t } = useTranslation();
    const user = useCurrentUser();
    const update = useUpdateContest(contest.id);
    const organisationId = useOrganisationStore((state) => state.organisationId);

    return (
        <ContestForm
            key={`${contest.name}-${contest.start_time.getTime()}-${contest.duration_seconds}-${
                contest.public
            }-${contest.official}-${contest.exam}-${contest.show_leaderboard_during_contest}`}
            mode="edit"
            contest={contest}
            canSetExam={organisationId !== "1" || contest.exam}
            canSetOfficial={isAdmin(user)}
            pending={update.isPending || !canEdit}
            onSubmit={(values) =>
                update.mutate(values, {
                    onSuccess: () => toast.success(t("management.contestForm.saved")),
                })
            }
        />
    );
};

/** Settings form, invite code and contest copying side by side. */
export const ContestSettings = ({ contest }: { contest: Contest }) => {
    const { t } = useTranslation();
    const { canEdit } = useContestAccess(contest);

    return (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
            <Section title={t("management.contestForm.editTitle")}>
                <SettingsForm contest={contest} canEdit={canEdit} />
            </Section>
            <div className="flex flex-col gap-6">
                <InviteSection
                    contestId={contest.id}
                    joinCode={contest.join_code}
                    canEdit={canEdit}
                />
                <CloneSection contestId={contest.id} />
            </div>
        </div>
    );
};

/** A bordered panel whose body is hidden until its header is clicked. */
export const CollapsiblePanel = ({
    title,
    hint,
    icon: Icon = Settings2,
    defaultOpen = false,
    children,
}: {
    title: ReactNode;
    hint?: ReactNode;
    icon?: ComponentType<{ className?: string }>;
    defaultOpen?: boolean;
    children: ReactNode;
}) => {
    const [open, setOpen] = useState(defaultOpen);

    return (
        <Collapsible open={open} onOpenChange={setOpen} className="flex flex-col gap-4">
            <CollapsibleTrigger asChild>
                <button
                    type="button"
                    className="bg-card hover:bg-muted/60 flex w-full items-center justify-between gap-3 rounded-md border px-4 py-3 text-left transition-colors"
                >
                    <span className="flex min-w-0 items-center gap-2">
                        <Icon className="text-muted-foreground size-4 shrink-0" />
                        <span className="font-medium">{title}</span>
                        {hint && (
                            <span className="text-muted-foreground hidden truncate text-sm sm:inline">
                                {hint}
                            </span>
                        )}
                    </span>
                    <ChevronDown
                        className={cn(
                            "text-muted-foreground size-4 shrink-0 transition-transform",
                            open && "rotate-180"
                        )}
                    />
                </button>
            </CollapsibleTrigger>
            <CollapsibleContent>{children}</CollapsibleContent>
        </Collapsible>
    );
};
