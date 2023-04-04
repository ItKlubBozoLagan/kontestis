import { zodResolver } from "@hookform/resolvers/zod";
import { ContestMemberPermissions, hasContestPermission } from "@kontestis/models";
import React, { FC, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useQueryClient } from "react-query";
import { z } from "zod";

import { SimpleButton } from "../../../../components/SimpleButton";
import { useContestContext } from "../../../../context/constestContext";
import { useAllContestAnnouncements } from "../../../../hooks/contest/announcements/useAllContestAnnouncements";
import { useCreateContestAnnouncement } from "../../../../hooks/contest/announcements/useCreateContestAnnouncement";
import { useTranslation } from "../../../../hooks/useTranslation";

const CreateAnnouncementSchema = z.object({
    message: z.string().min(1),
});

export const ContestAnnouncementsPage: FC = () => {
    const { contest, member } = useContestContext();

    const { register, handleSubmit, reset } = useForm<z.infer<typeof CreateAnnouncementSchema>>({
        resolver: zodResolver(CreateAnnouncementSchema),
        defaultValues: {
            message: "",
        },
    });

    const queryClient = useQueryClient();

    const createMutation = useCreateContestAnnouncement(contest.id);

    const { data: announcements } = useAllContestAnnouncements(contest.id);

    const onSubmit = handleSubmit((data) => {
        createMutation.reset();

        createMutation.mutate({
            message: data.message,
        });
    });

    useEffect(() => {
        if (!createMutation.isSuccess) return;

        queryClient.invalidateQueries(["contests", contest.id, "announcements"]);
        createMutation.reset();
        reset();
    }, [createMutation.isSuccess]);

    const { t } = useTranslation();

    return (
        <div tw={"flex gap-2 w-full justify-center"}>
            <div tw={"flex flex-col items-center gap-6 w-full"}>
                {hasContestPermission(
                    member.contest_permissions,
                    ContestMemberPermissions.CREATE_ANNOUNCEMENT
                ) && (
                    <form onSubmit={onSubmit}>
                        <div tw={"flex flex-col gap-2 w-96"}>
                            <label htmlFor={"message"}>
                                {t("contests.management.individual.announcements.label")}:
                            </label>
                            <textarea
                                {...register("message")}
                                tw={"resize-y min-h-[8rem] text-base"}
                            />
                            <SimpleButton tw={"mt-2"}>
                                {t("contests.management.individual.announcements.sendButton")}
                            </SimpleButton>
                        </div>
                    </form>
                )}
                <div tw={"w-full flex flex-wrap justify-center gap-4"}>
                    {(announcements ?? [])
                        .sort((a, b) => Number(b.id - a.id))
                        .map((announcement) => (
                            <div
                                tw={
                                    "bg-white p-2 w-full border border-solid border-black w-56 text-base whitespace-pre-line"
                                }
                                key={announcement.id.toString()}
                            >
                                {announcement.message}
                            </div>
                        ))}
                </div>
            </div>
        </div>
    );
};
