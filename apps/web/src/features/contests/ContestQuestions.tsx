import type { Contest } from "@kontestis/models";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Clock, MessageSquare, Send } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";

import { contestQueries, useCreateQuestion } from "@/api/contests";
import { EmptyState } from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { contestPhase } from "@/lib/contest";
import { formatDateTime } from "@/lib/format";

type Props = {
    contest: Contest;
    registered: boolean;
    canViewQuestions: boolean;
};

export const ContestQuestions = ({ contest, registered, canViewQuestions }: Props) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [question, setQuestion] = useState("");
    const create = useCreateQuestion(contest.id);
    const { data: threads = [] } = useQuery({
        ...contestQueries.questions(contest.id),
        enabled: registered || canViewQuestions,
    });

    const running = contestPhase(contest) === "running";

    const sorted = [...threads].sort(
        (a, b) =>
            (b.last_message_at?.getTime() ?? 0) - (a.last_message_at?.getTime() ?? 0) ||
            (b.id > a.id ? 1 : -1)
    );

    const submit = () => {
        const text = question.trim();

        if (!text) return;

        create.mutate(text, {
            onSuccess: (thread) => {
                setQuestion("");
                toast.success(t("contests.questions.created"));
                navigate(`/contest/${contest.id}/thread/${thread.id}`);
            },
        });
    };

    return (
        <div className="flex flex-col gap-4">
            {registered && running ? (
                <form
                    className="flex flex-col gap-2 sm:flex-row sm:items-end"
                    onSubmit={(event) => {
                        event.preventDefault();
                        submit();
                    }}
                >
                    <Textarea
                        value={question}
                        onChange={(event) => setQuestion(event.target.value)}
                        placeholder={t("contests.questions.ask")}
                        className="min-h-12 resize-y"
                    />
                    <Button type="submit" disabled={create.isPending || !question.trim()}>
                        <Send />
                        {t("contests.questions.send")}
                    </Button>
                </form>
            ) : canViewQuestions && !registered ? null : (
                <p className="text-muted-foreground text-sm">
                    {registered
                        ? t("contests.questions.onlyRunning")
                        : t("contests.questions.onlyRegistered")}
                </p>
            )}
            {sorted.length === 0 ? (
                <EmptyState icon={MessageSquare} title={t("contests.questions.empty")} />
            ) : (
                <ul className="flex flex-col gap-2">
                    {sorted.map((thread) => {
                        const waiting =
                            !thread.last_message_member_id ||
                            thread.last_message_member_id === thread.contest_member_id;

                        return (
                            <li key={thread.id.toString()}>
                                <Link
                                    to={`/contest/${contest.id}/thread/${thread.id}`}
                                    className="bg-card hover:bg-muted flex items-center justify-between gap-4 rounded-md border px-4 py-3 transition-colors"
                                >
                                    <span className="flex min-w-0 items-center gap-3">
                                        <MessageSquare className="text-muted-foreground size-4 shrink-0" />
                                        <span className="truncate">{thread.question}</span>
                                    </span>
                                    <span className="text-muted-foreground flex shrink-0 items-center gap-3 text-xs">
                                        {thread.last_message_at && (
                                            <time className="hidden sm:inline">
                                                {formatDateTime(thread.last_message_at)}
                                            </time>
                                        )}
                                        {waiting ? (
                                            <span className="flex items-center gap-1 text-amber-600">
                                                <Clock className="size-3.5" />
                                                {t("contests.questions.waiting")}
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1 text-green-600">
                                                <CheckCircle2 className="size-3.5" />
                                                {t("contests.questions.answered")}
                                            </span>
                                        )}
                                    </span>
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
};
