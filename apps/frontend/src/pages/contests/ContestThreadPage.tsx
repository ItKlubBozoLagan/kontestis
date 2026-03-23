import { zodResolver } from "@hookform/resolvers/zod";
import { FC, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { FiArrowLeft } from "react-icons/all";
import { useParams } from "react-router";
import { Link } from "react-router-dom";
import { z } from "zod";

import { SimpleButton } from "../../components/SimpleButton";
import { useAllContestQuestions } from "../../hooks/contest/questions/useAllContestQuestions";
import { useSendMessage } from "../../hooks/contest/questions/useSendMessage";
import { useThreadMessages } from "../../hooks/contest/questions/useThreadMessages";
import { useContest } from "../../hooks/contest/useContest";
import { useSelfContestMembers } from "../../hooks/contest/useSelfContestMembers";
import { useTranslation } from "../../hooks/useTranslation";

type PathParameters = {
    contestId: string;
    threadId: string;
};

const MessageSchema = z.object({
    content: z.string().min(1),
});

export const ContestThreadPage: FC = () => {
    const { contestId, threadId } = useParams<PathParameters>() as PathParameters;
    const { t } = useTranslation();

    const contestIdBigInt = BigInt(/^\d+$/.test(contestId) ? contestId : "0");
    const threadIdBigInt = BigInt(/^\d+$/.test(threadId) ? threadId : "0");

    const { data: contest } = useContest(contestIdBigInt);
    const { data: threads } = useAllContestQuestions(contestIdBigInt);
    const { data: selfMembers } = useSelfContestMembers();
    const { data: messages } = useThreadMessages([contestIdBigInt, threadIdBigInt]);
    const sendMessageMutation = useSendMessage([contestIdBigInt, threadIdBigInt]);

    const thread = useMemo(
        () => threads?.find((q) => q.id === threadIdBigInt),
        [threads, threadIdBigInt]
    );

    const selfMember = useMemo(
        () => selfMembers?.find((m) => m.contest_id === contestIdBigInt),
        [selfMembers, contestIdBigInt]
    );

    const { register, handleSubmit, reset } = useForm<z.infer<typeof MessageSchema>>({
        resolver: zodResolver(MessageSchema),
    });

    const onSubmit = handleSubmit((data) => {
        sendMessageMutation.mutate(data);
    });

    useEffect(() => {
        if (!sendMessageMutation.isSuccess) return;

        reset();
    }, [sendMessageMutation.isSuccess]);

    if (!contest || !thread) return <div>{t("contests.page.loading")}</div>;

    return (
        <div tw={"w-full flex flex-col justify-start items-center gap-6 mt-5"}>
            <div tw={"w-full max-w-[800px] flex flex-col gap-6"}>
                <Link
                    to={`/contest/${contestId}`}
                    tw={"flex items-center gap-2 text-neutral-600 hover:text-sky-800"}
                >
                    <FiArrowLeft size={"16px"} />
                    <span tw={"text-sm"}>{contest.name}</span>
                </Link>
                <div tw={"w-full border-2 border-solid border-neutral-300"}>
                    <div tw={"w-full text-neutral-800 text-lg bg-neutral-100 text-center py-2"}>
                        {thread.question}
                    </div>
                    <div tw={"w-full flex flex-col bg-white"}>
                        {(messages ?? []).map((message) => {
                            const isSelf = selfMember && message.author_member_id === selfMember.id;

                            return (
                                <div
                                    key={message.id.toString()}
                                    tw={
                                        "w-full px-6 py-4 border-b border-solid border-neutral-200 flex flex-col gap-2"
                                    }
                                    css={
                                        isSelf
                                            ? { backgroundColor: "#f8fafc" }
                                            : { backgroundColor: "#eff6ff" }
                                    }
                                >
                                    <div tw={"flex justify-between items-center"}>
                                        <span
                                            tw={"text-xs font-mono"}
                                            css={
                                                isSelf ? { color: "#64748b" } : { color: "#2563eb" }
                                            }
                                        >
                                            {isSelf
                                                ? t("contests.individual.questions.chat.you")
                                                : message.author_name ??
                                                  t(
                                                      "contests.individual.questions.chat.management"
                                                  )}
                                        </span>
                                        <span tw={"text-xs text-neutral-400"}>
                                            {message.created_at.toLocaleTimeString([], {
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            })}
                                        </span>
                                    </div>
                                    <span tw={"text-sm whitespace-pre-line"}>
                                        {message.content}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
                <form onSubmit={onSubmit} tw={"flex gap-2 items-end"}>
                    <textarea
                        tw={
                            "flex-1 py-2 px-3 bg-neutral-200 border border-solid border-neutral-300 text-base outline-none resize-y min-h-[3rem] max-h-[8rem] hover:bg-neutral-300"
                        }
                        placeholder={t("contests.individual.questions.chat.placeholder")}
                        {...register("content")}
                    />
                    <SimpleButton>{t("contests.individual.questions.sendButton")}</SimpleButton>
                </form>
            </div>
        </div>
    );
};
