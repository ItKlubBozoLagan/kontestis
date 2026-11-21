import type { Contest } from "@kontestis/models";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Clock, Send } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";

import { contestQueries, useCreateQuestion } from "@/api/contests";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { contestPhase } from "@/lib/contest";
import { formatDateTime } from "@/lib/format";

const VISIBLE = 4;

type Props = {
    contest: Contest;
    registered: boolean;
    canViewQuestions: boolean;
};

export const ContestQuestions = ({ contest, registered, canViewQuestions }: Props) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [question, setQuestion] = useState("");
    const [showAll, setShowAll] = useState(false);
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
        <div className="flex flex-col gap-3">
            {registered && running ? (
                <form
                    className="flex flex-col gap-2"
                    onSubmit={(event) => {
                        event.preventDefault();
                        submit();
                    }}
                >
                    <Textarea
                        value={question}
                        onChange={(event) => setQuestion(event.target.value)}
                        placeholder={t("contests.questions.ask")}
                        className="min-h-16 resize-y"
                        aria-label={t("contests.questions.ask")}
                        onKeyDown={(event) => {
                            if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
                                event.preventDefault();
                                submit();
                            }
                        }}
                    />
                    <Button
                        type="submit"
                        size="sm"
                        className="self-end"
                        disabled={create.isPending || !question.trim()}
                    >
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
                <p className="text-muted-foreground py-2 text-center text-sm">
                    {t("contests.questions.empty")}
                </p>
            ) : (
                <ul className="flex flex-col gap-2">
                    {(showAll ? sorted : sorted.slice(0, VISIBLE)).map((thread) => {
                        const waiting =
                            !thread.last_message_member_id ||
                            thread.last_message_member_id === thread.contest_member_id;

                        return (
                            <li key={thread.id.toString()}>
                                <Link
                                    to={`/contest/${contest.id}/thread/${thread.id}`}
                                    className="bg-card hover:bg-muted focus-visible:ring-ring flex flex-col gap-1 rounded-md border px-3 py-2 transition-colors outline-none focus-visible:ring-2"
                                >
                                    <span className="line-clamp-2 text-sm break-words">
                                        {thread.question}
                                    </span>
                                    <span className="text-muted-foreground flex items-center justify-between gap-3 text-xs">
                                        {thread.last_message_at && (
                                            <time>{formatDateTime(thread.last_message_at)}</time>
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
            {sorted.length > VISIBLE && (
                <Button variant="ghost" size="sm" onClick={() => setShowAll((value) => !value)}>
                    {showAll
                        ? t("contests.announcements.showFewer")
                        : t("contests.announcements.showAll", { count: sorted.length })}
                </Button>
            )}
        </div>
    );
};
