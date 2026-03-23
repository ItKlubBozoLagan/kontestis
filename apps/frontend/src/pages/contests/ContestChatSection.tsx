import { zodResolver } from "@hookform/resolvers/zod";
import { Snowflake } from "@kontestis/models";
import { FC, useEffect } from "react";
import { useForm } from "react-hook-form";
import { FiMessageSquare } from "react-icons/all";
import { Link } from "react-router-dom";
import { z } from "zod";

import { SimpleButton } from "../../components/SimpleButton";
import { TitledSection } from "../../components/TitledSection";
import { useAllContestQuestions } from "../../hooks/contest/questions/useAllContestQuestions";
import { useCreateQuestion } from "../../hooks/contest/questions/useCreateQuestion";
import { useTranslation } from "../../hooks/useTranslation";

type Properties = {
    contestId: Snowflake;
};

const NewThreadSchema = z.object({
    question: z.string().min(1),
});

export const ContestChatSection: FC<Properties> = ({ contestId }) => {
    const { data: threads } = useAllContestQuestions(contestId);
    const createThreadMutation = useCreateQuestion(contestId);
    const { t } = useTranslation();

    const { register, handleSubmit, reset } = useForm<z.infer<typeof NewThreadSchema>>({
        resolver: zodResolver(NewThreadSchema),
    });

    const onNewThread = handleSubmit((data) => {
        createThreadMutation.mutate(data);
    });

    useEffect(() => {
        if (!createThreadMutation.isSuccess) return;

        reset();
    }, [createThreadMutation.isSuccess]);

    const sortedThreads = [...(threads ?? [])].sort((a, b) => {
        const aTime = a.last_message_at?.getTime() ?? Number(a.id >> 22n);
        const bTime = b.last_message_at?.getTime() ?? Number(b.id >> 22n);

        return bTime - aTime;
    });

    return (
        <TitledSection
            title={t("contests.individual.questions.label")}
            tw={"flex w-full flex-col gap-4"}
        >
            <form onSubmit={onNewThread} tw={"w-full flex flex-col gap-2"}>
                <label tw={"text-sm pl-1"}>{t("contests.individual.questions.newThread")}</label>
                <input
                    tw={
                        "w-full py-1 px-2 bg-neutral-200 border border-solid border-neutral-300 text-base outline-none hover:bg-neutral-300"
                    }
                    {...register("question")}
                />
                <SimpleButton>{t("contests.individual.questions.sendButton")}</SimpleButton>
            </form>
            {sortedThreads.map((thread) => {
                const waiting =
                    !thread.last_message_member_id ||
                    thread.last_message_member_id === thread.contest_member_id;

                return (
                    <Link
                        key={thread.id.toString()}
                        to={`/contest/${contestId}/thread/${thread.id}`}
                        tw={
                            "w-full bg-neutral-100 border-2 border-solid border-neutral-200 p-4 flex justify-between gap-4 hover:(bg-neutral-200 cursor-pointer)"
                        }
                    >
                        <div tw={"flex items-center gap-4 text-lg"}>
                            <FiMessageSquare size={"18px"} />
                            <span tw={"truncate"}>{thread.question}</span>
                        </div>
                        {waiting && (
                            <span tw={"text-sm text-neutral-500 whitespace-nowrap"}>
                                {t("contests.individual.questions.list.waiting")}
                            </span>
                        )}
                    </Link>
                );
            })}
        </TitledSection>
    );
};
