import { ContestMemberPermissions, type ContestQuestion } from "@kontestis/models";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNowStrict } from "date-fns";
import { CircleCheck, MessageSquare, Reply, Send } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { toast } from "sonner";

import { contestQueries, useSendThreadMessage } from "@/api/contests";
import { EmptyState } from "@/components/common/EmptyState";
import { Section } from "@/components/common/Section";
import { Spinner } from "@/components/common/Spinner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { needsReply } from "@/features/management/shared/questions";
import { useContestAccess } from "@/hooks/useContestAccess";
import { useDateLocale } from "@/hooks/useDateLocale";
import { useNow } from "@/hooks/useNow";
import { snowflakeTime } from "@/lib/snowflake";
import { cn } from "@/lib/utils";

const SHOWN_WAITING = 8;
const SHOWN_ANSWERED = 3;
const FOLLOW_UP_GAP = 5000;

const waitingSince = (thread: ContestQuestion) =>
    thread.last_message_at ?? snowflakeTime(thread.id);

/** The opening message is the question itself; later activity means there is a follow-up. */
const hasFollowUp = (thread: ContestQuestion) =>
    !!thread.last_message_at &&
    thread.last_message_at.getTime() - snowflakeTime(thread.id).getTime() > FOLLOW_UP_GAP;

const LatestMessage = ({ contestId, thread }: { contestId: bigint; thread: ContestQuestion }) => {
    const { t } = useTranslation();
    const { data: messages } = useQuery({
        ...contestQueries.threadMessages(contestId, thread.id),
        refetchInterval: 30_000,
    });
    const latest = messages?.at(-1);

    if (!latest || latest.author_member_id !== thread.contest_member_id) return null;

    return (
        <div className="border-l-2 border-amber-300 pl-3 text-sm dark:border-amber-800">
            <span className="text-muted-foreground block text-xs">
                {t("management.overview.control.queue.latest")}
            </span>
            <p className="line-clamp-4 break-words whitespace-pre-line">{latest.content}</p>
        </div>
    );
};

const InlineReply = ({
    contestId,
    threadId,
    onDone,
}: {
    contestId: bigint;
    threadId: bigint;
    onDone: () => void;
}) => {
    const { t } = useTranslation();
    const send = useSendThreadMessage(contestId, threadId);
    const [draft, setDraft] = useState("");

    return (
        <form
            className="flex flex-col gap-2"
            onSubmit={(event) => {
                event.preventDefault();

                const content = draft.trim();

                if (!content) return;

                send.mutate(content, {
                    onSuccess: () => {
                        toast.success(t("management.overview.control.queue.sent"));
                        onDone();
                    },
                });
            }}
        >
            <Textarea
                autoFocus
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder={t("management.overview.control.queue.replyPlaceholder")}
                className="min-h-20"
            />
            <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" size="sm" onClick={onDone}>
                    {t("management.overview.control.queue.cancel")}
                </Button>
                <Button type="submit" size="sm" disabled={send.isPending || !draft.trim()}>
                    <Send />
                    {t("management.overview.control.queue.send")}
                </Button>
            </div>
        </form>
    );
};

const WaitingThread = ({
    contestId,
    thread,
    author,
    canReply,
}: {
    contestId: bigint;
    thread: ContestQuestion;
    author: string;
    canReply: boolean;
}) => {
    const { t } = useTranslation();
    const locale = useDateLocale();
    const [replying, setReplying] = useState(false);
    const since = waitingSince(thread);

    return (
        <li className="flex flex-col gap-2 px-4 py-3">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                <span className="text-sm font-semibold">{author}</span>
                <time
                    dateTime={since.toISOString()}
                    className="text-xs font-medium text-amber-700 tabular-nums dark:text-amber-300"
                >
                    {t("management.overview.control.queue.waited", {
                        time: formatDistanceToNowStrict(since, { locale }),
                    })}
                </time>
            </div>
            <p className="line-clamp-4 text-sm break-words whitespace-pre-line">
                {thread.question}
            </p>
            {hasFollowUp(thread) && <LatestMessage contestId={contestId} thread={thread} />}
            {replying ? (
                <InlineReply
                    contestId={contestId}
                    threadId={thread.id}
                    onDone={() => setReplying(false)}
                />
            ) : (
                <div className="flex flex-wrap gap-2">
                    {canReply && (
                        <Button size="xs" onClick={() => setReplying(true)}>
                            <Reply />
                            {t("management.overview.control.queue.reply")}
                        </Button>
                    )}
                    <Button asChild size="xs" variant="outline">
                        <Link to={`/management/${contestId}/questions/${thread.id}`}>
                            {t("management.overview.control.queue.open")}
                        </Link>
                    </Button>
                </div>
            )}
        </li>
    );
};

const AnsweredList = ({
    contestId,
    threads,
    nameOf,
}: {
    contestId: bigint;
    threads: ContestQuestion[];
    nameOf: (thread: ContestQuestion) => string;
}) => {
    const { t } = useTranslation();

    if (threads.length === 0) return null;

    return (
        <div className="bg-muted/30 border-t px-4 py-3">
            <h3 className="text-muted-foreground mb-1 text-xs font-medium tracking-wide uppercase">
                {t("management.overview.control.queue.answered")}
            </h3>
            <ul className="flex flex-col">
                {threads.map((thread) => (
                    <li key={thread.id.toString()}>
                        <Link
                            to={`/management/${contestId}/questions/${thread.id}`}
                            className="hover:text-foreground text-muted-foreground flex items-center gap-2 py-1 text-sm"
                        >
                            <CircleCheck className="size-3.5 shrink-0 text-green-600" />
                            <span className="truncate">{thread.question}</span>
                            <span className="ml-auto shrink-0 text-xs">{nameOf(thread)}</span>
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    );
};

const byActivity = (a: ContestQuestion, b: ContestQuestion) =>
    waitingSince(a).getTime() - waitingSince(b).getTime();

/** Threads waiting for staff, longest waiting first, with inline answers. */
export const QuestionQueue = ({
    contestId,
    threads,
    className,
}: {
    contestId: bigint;
    threads: ContestQuestion[] | undefined;
    className?: string;
}) => {
    const { t } = useTranslation();
    const { can } = useContestAccess({ id: contestId });
    const { data: members } = useQuery(contestQueries.leaderboard(contestId, true));

    useNow();

    const names = new Map(members?.map((member) => [member.id.toString(), member.full_name]));
    const nameOf = (thread: ContestQuestion) =>
        names.get(thread.contest_member_id.toString()) ?? t("management.questions.unknownMember");

    const waiting = (threads ?? []).filter(needsReply).sort(byActivity);
    const answered = (threads ?? [])
        .filter((thread) => !needsReply(thread))
        .sort((a, b) => byActivity(b, a))
        .slice(0, SHOWN_ANSWERED);
    const hidden = waiting.length - SHOWN_WAITING;

    return (
        <Section
            title={t("management.overview.control.queue.title")}
            icon={MessageSquare}
            className={cn(
                "h-fit",
                waiting.length > 0 && "border-amber-300 dark:border-amber-800",
                className
            )}
            contentClassName="p-0"
            actions={
                <>
                    <Badge
                        variant="outline"
                        className={cn(
                            "text-sm",
                            waiting.length > 0
                                ? "border-amber-400 bg-amber-100 font-semibold text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-100"
                                : "text-muted-foreground"
                        )}
                    >
                        {t("management.overview.control.queue.waiting", { count: waiting.length })}
                    </Badge>
                    <Button asChild variant="ghost" size="xs">
                        <Link to={`/management/${contestId}/questions`}>
                            {t("management.overview.control.queue.all")}
                        </Link>
                    </Button>
                </>
            }
        >
            {!threads ? (
                <Spinner className="mx-auto my-8" />
            ) : waiting.length === 0 ? (
                <EmptyState
                    icon={CircleCheck}
                    title={t("management.overview.control.queue.empty")}
                    description={t("management.overview.control.queue.emptyHint")}
                    className="py-8"
                />
            ) : (
                <ul className="divide-y">
                    {waiting.slice(0, SHOWN_WAITING).map((thread) => (
                        <WaitingThread
                            key={thread.id.toString()}
                            contestId={contestId}
                            thread={thread}
                            author={nameOf(thread)}
                            canReply={can(ContestMemberPermissions.ANSWER_QUESTIONS)}
                        />
                    ))}
                    {hidden > 0 && (
                        <li className="px-4 py-2 text-sm">
                            <Link
                                to={`/management/${contestId}/questions`}
                                className="text-primary hover:underline"
                            >
                                {t("management.overview.control.queue.more", { count: hidden })}
                            </Link>
                        </li>
                    )}
                </ul>
            )}
            <AnsweredList contestId={contestId} threads={answered} nameOf={nameOf} />
        </Section>
    );
};
