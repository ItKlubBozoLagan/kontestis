import { zodResolver } from "@hookform/resolvers/zod";
import { ContestMemberPermissions } from "@kontestis/models";
import { FC, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { FiArrowLeft } from "react-icons/all";
import { useParams } from "react-router";
import { Link } from "react-router-dom";
import { z } from "zod";

import { CanContestMember } from "../../../../components/CanContestMember";
import { SimpleButton } from "../../../../components/SimpleButton";
import { useContestContext } from "../../../../context/constestContext";
import { useAllContestMembers } from "../../../../hooks/contest/participants/useAllContestMembers";
import { useAllContestQuestions } from "../../../../hooks/contest/questions/useAllContestQuestions";
import { useSendMessage } from "../../../../hooks/contest/questions/useSendMessage";
import { useThreadMessages } from "../../../../hooks/contest/questions/useThreadMessages";
import { useTranslation } from "../../../../hooks/useTranslation";

type PathParameters = {
    threadId: string;
};

const MessageSchema = z.object({
    content: z.string().min(1),
});

export const ContestThreadDetailPage: FC = () => {
    const { threadId } = useParams<PathParameters>() as PathParameters;
    const { contest, member } = useContestContext();
    const { t } = useTranslation();

    const threadIdBigInt = BigInt(/^\d+$/.test(threadId) ? threadId : "0");

    const { data: threads } = useAllContestQuestions(contest.id);
    const thread = useMemo(
        () => threads?.find((q) => q.id === threadIdBigInt),
        [threads, threadIdBigInt]
    );

    const { data: messages } = useThreadMessages([contest.id, threadIdBigInt]);
    const { data: members } = useAllContestMembers([contest.id, {}]);
    const sendMessageMutation = useSendMessage([contest.id, threadIdBigInt]);

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

    const getThreadOwnerName = () => {
        const m = members?.find((mem) => mem.id === thread?.contest_member_id);

        return m?.full_name ?? t("contests.management.individual.questions.unknownMember");
    };

    if (!thread) return <div>{t("contests.page.loading")}</div>;

    return (
        <div tw={"w-full flex flex-col gap-4"}>
            <Link to={".."} tw={"flex items-center gap-2 text-neutral-600 hover:text-sky-800"}>
                <FiArrowLeft size={"16px"} />
                <span tw={"text-sm"}>
                    {t("contests.management.individual.questions.backToList")}
                </span>
            </Link>
            <div tw={"w-full border-2 border-solid border-neutral-300"}>
                <div tw={"w-full text-neutral-800 text-lg bg-neutral-100 text-center py-2"}>
                    {thread.question}
                </div>
                <div
                    tw={"w-full bg-neutral-100 border-b border-solid border-neutral-200 px-6 py-2"}
                >
                    <span tw={"text-sm text-neutral-500"}>{getThreadOwnerName()}</span>
                </div>
                <div tw={"w-full flex flex-col bg-white"}>
                    {(messages ?? []).map((message) => {
                        const isContestant = message.author_member_id === thread.contest_member_id;

                        return (
                            <div
                                key={message.id.toString()}
                                tw={
                                    "w-full px-6 py-4 border-b border-solid border-neutral-200 flex flex-col gap-2"
                                }
                                css={
                                    isContestant
                                        ? { backgroundColor: "#ffffff" }
                                        : { backgroundColor: "#eff6ff" }
                                }
                            >
                                <div tw={"flex justify-between items-center"}>
                                    <span
                                        tw={"text-xs font-mono"}
                                        css={
                                            isContestant
                                                ? { color: "#64748b" }
                                                : { color: "#2563eb" }
                                        }
                                    >
                                        {message.author_name ??
                                            t(
                                                "contests.management.individual.questions.unknownMember"
                                            )}
                                    </span>
                                    <span tw={"text-xs text-neutral-400"}>
                                        {message.created_at.toLocaleString()}
                                    </span>
                                </div>
                                <span tw={"text-sm whitespace-pre-line"}>{message.content}</span>
                            </div>
                        );
                    })}
                </div>
            </div>
            <CanContestMember
                contest={contest}
                member={member}
                permission={ContestMemberPermissions.ANSWER_QUESTIONS}
            >
                <form onSubmit={onSubmit} tw={"flex flex-col gap-2"}>
                    <label tw={"text-sm pl-1"}>
                        {t("contests.management.individual.questions.replyButton")}
                    </label>
                    <textarea
                        tw={
                            "resize-y min-h-[4rem] text-base py-2 px-3 bg-neutral-200 border border-solid border-neutral-300 outline-none hover:bg-neutral-300"
                        }
                        placeholder={t("contests.management.individual.questions.replyPlaceholder")}
                        {...register("content")}
                    />
                    <SimpleButton>
                        {t("contests.management.individual.questions.replyButton")}
                    </SimpleButton>
                </form>
            </CanContestMember>
        </div>
    );
};
