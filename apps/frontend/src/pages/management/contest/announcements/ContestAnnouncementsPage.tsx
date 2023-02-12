import { zodResolver } from "@hookform/resolvers/zod";
import { ContestMemberPermissions, hasContestPermission } from "@kontestis/models";
import React, { FC, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useQueryClient } from "react-query";
import { z } from "zod";

import { SimpleButton } from "../../../../components/SimpleButton";
import { TitledInput } from "../../../../components/TitledInput";
import { useContestContext } from "../../../../context/constestContext";
import { useAllContestAnnouncements } from "../../../../hooks/contest/announcements/useAllContestAnnouncements";
import { useCreateContestAnnouncement } from "../../../../hooks/contest/announcements/useCreateContestAnnouncement";

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

        queryClient.invalidateQueries(["contest", contest.id, "announcements"]);
        createMutation.reset();
        reset();
    }, [createMutation.isSuccess]);

    return (
        <div tw={"flex flex-col gap-2 w-full items-center"}>
            {(announcements ?? [])
                .sort((a, b) => Number(a.id - b.id))
                .map((announcement) => (
                    <span key={announcement.id + ""}>{announcement.message}</span>
                ))}
            {hasContestPermission(
                member.contest_permissions,
                ContestMemberPermissions.CREATE_ANNOUNCEMENT
            ) && (
                <form onSubmit={onSubmit}>
                    <div tw={"flex flex-col gap-2"}>
                        <TitledInput label={"Announcement"} bigLabel {...register("message")} />
                        <SimpleButton tw={"mt-2"}>Send</SimpleButton>
                    </div>
                </form>
            )}
        </div>
    );
};
