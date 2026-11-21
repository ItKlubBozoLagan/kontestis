import type { ContestQuestion } from "@kontestis/models";
import { useQuery } from "@tanstack/react-query";
import { SendHorizontal } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { contestQueries, useSendThreadMessage } from "@/api/contests";
import { Spinner } from "@/components/common/Spinner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

type Props = {
    contestId: bigint;
    thread: ContestQuestion;
    /**
     * "participant": messages from the thread owner are "You", the rest are staff.
     * "staff": messages from the thread owner are shown on the left with their name.
     */
    perspective: "participant" | "staff";
    canReply: boolean;
};

/** Conversation of one contest question thread, polled every few seconds. */
export const ThreadChat = ({ contestId, thread, perspective, canReply }: Props) => {
    const { t } = useTranslation();
    const { data: messages, isPending } = useQuery(
        contestQueries.threadMessages(contestId, thread.id)
    );
    const send = useSendThreadMessage(contestId, thread.id);
    const [draft, setDraft] = useState("");
    const bottom = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottom.current?.scrollIntoView({ block: "nearest" });
    }, [messages?.length]);

    const submit = () => {
        const content = draft.trim();

        if (!content) return;

        send.mutate(content, { onSuccess: () => setDraft("") });
    };

    return (
        <div className="bg-card flex w-full flex-col overflow-hidden rounded-md border">
            <div className="bg-muted/70 border-b px-4 py-3 text-center text-base font-medium whitespace-pre-line">
                {thread.question}
            </div>
            <div className="flex max-h-[60vh] min-h-40 flex-col gap-3 overflow-y-auto p-4">
                {isPending && <Spinner className="mx-auto" />}
                {messages?.length === 0 && (
                    <p className="text-muted-foreground text-center text-sm">{t("thread.empty")}</p>
                )}
                {messages?.map((message) => {
                    const fromOwner = message.author_member_id === thread.contest_member_id;
                    const mine = perspective === "participant" ? fromOwner : !fromOwner;
                    const author =
                        perspective === "participant"
                            ? fromOwner
                                ? t("thread.you")
                                : message.author_name ?? t("thread.staff")
                            : message.author_name ?? t("thread.unknown");

                    return (
                        <div
                            key={message.id.toString()}
                            className={cn(
                                "flex max-w-[85%] flex-col gap-1",
                                mine ? "self-end items-end" : "self-start"
                            )}
                        >
                            <div className="text-muted-foreground flex items-center gap-2 text-xs">
                                <span className={cn("font-mono", !fromOwner && "text-primary")}>
                                    {author}
                                </span>
                                <time>{formatDateTime(message.created_at)}</time>
                            </div>
                            <div
                                className={cn(
                                    "rounded-lg px-3 py-2 text-sm whitespace-pre-line break-words",
                                    mine
                                        ? "bg-primary text-primary-foreground rounded-br-sm"
                                        : "bg-muted rounded-bl-sm"
                                )}
                            >
                                {message.content}
                            </div>
                        </div>
                    );
                })}
                <div ref={bottom} />
            </div>
            {canReply && (
                <form
                    className="flex items-end gap-2 border-t p-3"
                    onSubmit={(event) => {
                        event.preventDefault();
                        submit();
                    }}
                >
                    <Textarea
                        value={draft}
                        onChange={(event) => setDraft(event.target.value)}
                        onKeyDown={(event) => {
                            if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
                                event.preventDefault();
                                submit();
                            }
                        }}
                        placeholder={t("thread.placeholder")}
                        className="max-h-40 min-h-12 resize-y"
                    />
                    <Button
                        type="submit"
                        disabled={send.isPending || !draft.trim()}
                        title={t("thread.hint")}
                    >
                        <SendHorizontal />
                        {perspective === "staff" ? t("thread.reply") : t("thread.send")}
                    </Button>
                </form>
            )}
        </div>
    );
};
