import { ContestMemberPermissions } from "@kontestis/models";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router";

import { contestQueries } from "@/api/contests";
import { EmptyState } from "@/components/common/EmptyState";
import { ContestPhaseBadge } from "@/components/contest/ContestPhaseBadge";
import { ThreadChat } from "@/components/contest/ThreadChat";
import { useContestAccess } from "@/hooks/useContestAccess";

export const ContestThreadPage = () => {
    const { t } = useTranslation();
    const { contestId = "0", threadId = "0" } = useParams();
    const { data: contest } = useSuspenseQuery(contestQueries.detail(contestId));
    const { data: threads } = useSuspenseQuery(contestQueries.questions(contestId));
    const access = useContestAccess(contest);

    const thread = threads.find((it) => it.id.toString() === threadId);
    const isOwner = !!access.member?.id && access.member.id === thread?.contest_member_id;
    const canAnswer = access.can(ContestMemberPermissions.ANSWER_QUESTIONS);

    return (
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
            <div className="flex items-center justify-between gap-2">
                <Link
                    to={`/contest/${contest.id}?tab=questions`}
                    className="text-muted-foreground hover:text-foreground flex items-center gap-2 text-sm"
                >
                    <ArrowLeft className="size-4" />
                    {t("contests.thread.back", { name: contest.name })}
                </Link>
                <ContestPhaseBadge contest={contest} />
            </div>
            {thread ? (
                <ThreadChat
                    contestId={contest.id}
                    thread={thread}
                    perspective={isOwner || !canAnswer ? "participant" : "staff"}
                    canReply={isOwner || canAnswer}
                />
            ) : (
                <EmptyState title={t("contests.thread.notFound")} />
            )}
        </div>
    );
};
