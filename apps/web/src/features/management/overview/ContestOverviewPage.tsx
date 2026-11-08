import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import {
    CalendarClock,
    Copy,
    KeyRound,
    Megaphone,
    MessageSquare,
    RotateCcw,
    Trophy,
    Users,
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { toast } from "sonner";

import { useCurrentUser } from "@/api/auth";
import {
    contestQueries,
    useCopyContest,
    useRotateJoinCode,
    useUpdateContest,
} from "@/api/contests";
import { organisationQueries } from "@/api/organisations";
import { problemQueries } from "@/api/problems";
import { CopyButton } from "@/components/common/CopyButton";
import { Section } from "@/components/common/Section";
import { StatCard } from "@/components/common/StatCard";
import { ContestPhaseBadge } from "@/components/contest/ContestPhaseBadge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ContestForm } from "@/features/management/shared/ContestForm";
import { needsReply } from "@/features/management/shared/questions";
import { StandingsTable } from "@/features/management/shared/StandingsTable";
import { useManagedContest } from "@/features/management/useManagedContest";
import { useContestAccess } from "@/hooks/useContestAccess";
import { contestEnd } from "@/lib/contest";
import { formatDateTime } from "@/lib/format";
import { isAdmin } from "@/lib/permissions";
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
                        <SelectTrigger className="flex-1">
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

export const ContestOverviewPage = () => {
    const { t } = useTranslation();
    const user = useCurrentUser();
    const contest = useManagedContest();
    const { canEdit } = useContestAccess(contest);
    const update = useUpdateContest(contest.id);
    const organisationId = useOrganisationStore((state) => state.organisationId);

    const { data: members } = useSuspenseQuery(contestQueries.leaderboard(contest.id));
    const { data: problems } = useSuspenseQuery(problemQueries.byContest(contest.id));
    const { data: announcements } = useQuery(contestQueries.announcements(contest.id));
    const { data: questions } = useQuery(contestQueries.questions(contest.id));

    const unanswered = questions?.filter(needsReply).length;

    return (
        <div className="flex flex-col gap-6">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
                <StatCard
                    className="col-span-2 lg:col-span-1"
                    label={t("management.overview.status")}
                    icon={CalendarClock}
                    value={<ContestPhaseBadge contest={contest} className="text-sm" />}
                    hint={`${formatDateTime(contest.start_time)} – ${formatDateTime(
                        new Date(contestEnd(contest))
                    )}`}
                />
                <StatCard
                    label={t("management.overview.participants")}
                    icon={Users}
                    value={members.length}
                />
                <StatCard
                    label={t("management.overview.problems")}
                    icon={Trophy}
                    value={problems.length}
                />
                <StatCard
                    label={t("management.overview.announcements")}
                    icon={Megaphone}
                    value={announcements?.length ?? "–"}
                />
                <StatCard
                    label={t("management.overview.unansweredQuestions")}
                    icon={MessageSquare}
                    value={unanswered ?? "–"}
                    className={unanswered ? "border-amber-300" : undefined}
                />
            </div>
            <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
                <Section title={t("management.contestForm.editTitle")}>
                    <ContestForm
                        key={`${contest.name}-${contest.start_time.getTime()}-${
                            contest.duration_seconds
                        }-${contest.public}-${contest.official}-${contest.exam}-${
                            contest.show_leaderboard_during_contest
                        }`}
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
            <Section
                title={t("management.overview.standings")}
                icon={Trophy}
                contentClassName="p-0 sm:p-4"
            >
                <StandingsTable members={members} problems={problems} />
            </Section>
        </div>
    );
};
