import { ContestMemberPermissions } from "@kontestis/models";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { ArrowLeft, MessageSquareOff } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router";

import { contestQueries } from "@/api/contests";
import { EmptyState } from "@/components/common/EmptyState";
import { ThreadChat } from "@/components/contest/ThreadChat";
import { Button } from "@/components/ui/button";
import { useManagedContest } from "@/features/management/useManagedContest";
import { useContestAccess } from "@/hooks/useContestAccess";

export const QuestionThreadPage = () => {
    const { t } = useTranslation();
    const { threadId } = useParams<{ threadId: string }>();
    const contest = useManagedContest();
    const { can } = useContestAccess(contest);
    const { data: threads } = useSuspenseQuery(contestQueries.questions(contest.id));
    const { data: members } = useQuery(contestQueries.leaderboard(contest.id, true));

    const thread = threads.find((it) => it.id.toString() === threadId);
    const owner = thread && members?.find((member) => member.id === thread.contest_member_id);

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <Button variant="ghost" size="sm" asChild className="w-fit">
                    <Link to={`/management/${contest.id}/questions`}>
                        <ArrowLeft />
                        {t("management.questions.back")}
                    </Link>
                </Button>
                {thread && (
                    <span className="text-muted-foreground text-sm">
                        {t("management.questions.member")}:{" "}
                        <span className="text-foreground font-medium">
                            {owner?.full_name ?? t("management.questions.unknownMember")}
                        </span>
                    </span>
                )}
            </div>
            {thread ? (
                <ThreadChat
                    contestId={contest.id}
                    thread={thread}
                    perspective="staff"
                    canReply={can(ContestMemberPermissions.ANSWER_QUESTIONS)}
                />
            ) : (
                <EmptyState icon={MessageSquareOff} title={t("management.questions.notFound")} />
            )}
        </div>
    );
};
