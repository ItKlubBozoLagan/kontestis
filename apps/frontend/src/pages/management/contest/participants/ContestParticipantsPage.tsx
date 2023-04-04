import { zodResolver } from "@hookform/resolvers/zod";
import { ContestMemberWithInfo } from "@kontestis/models";
import React, { FC, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useQueryClient } from "react-query";
import tw, { theme } from "twin.macro";
import { z } from "zod";

import { Breadcrumb } from "../../../../components/Breadcrumb";
import { DomainBreadcrumb } from "../../../../components/DomainBreadcrumb";
import { RankBreadcrumb } from "../../../../components/RankBreadcrumb";
import { SimpleButton } from "../../../../components/SimpleButton";
import { TitledInput } from "../../../../components/TitledInput";
import { useContestContext } from "../../../../context/constestContext";
import { useAddParticipant } from "../../../../hooks/contest/participants/useAddParticipant";
import { useAllContestMembers } from "../../../../hooks/contest/participants/useAllContestMembers";
import { useRemoveParticipant } from "../../../../hooks/contest/participants/useRemoveParticipant";
import { useTranslation } from "../../../../hooks/useTranslation";

type MemberBoxProperties = {
    member: ContestMemberWithInfo;
    admin?: boolean;
};

const MemberBox: FC<MemberBoxProperties> = ({ member, admin }) => {
    const { contest } = useContestContext();

    const [confirmDelete, setConfirmDelete] = useState(false);

    const deleteMutation = useRemoveParticipant(contest.id);

    const queryClient = useQueryClient();

    const onDeleteClick = () => {
        if (deleteMutation.isLoading) return;

        if (!confirmDelete) {
            setConfirmDelete(true);

            return;
        }

        deleteMutation.mutate(member.user_id);
    };

    useEffect(() => {
        if (!deleteMutation.isSuccess) return;

        queryClient.invalidateQueries(["contests", contest.id, "members"]);
    }, [deleteMutation]);

    const { t } = useTranslation();

    return (
        <div
            key={member.id.toString()}
            tw={"p-4 bg-neutral-200 flex justify-between border border-solid border-black"}
        >
            <div tw={"flex gap-2"}>
                {admin && (
                    <Breadcrumb color={theme`colors.red.400`}>
                        {t("account.breadcrumbs.creator")}
                    </Breadcrumb>
                )}
                <DomainBreadcrumb email={member.email} />
                <RankBreadcrumb specificElo={member.elo} />
                {member.full_name}
            </div>
            {!admin && (
                <div tw={"flex items-center"}>
                    <span
                        tw={"text-red-600 cursor-pointer select-none"}
                        css={
                            deleteMutation.isLoading || deleteMutation.isSuccess
                                ? tw`text-neutral-600`
                                : ""
                        }
                        onClick={onDeleteClick}
                    >
                        {confirmDelete
                            ? t("contests.management.individual.participants.remove.confirm")
                            : t(
                                  "contests.management.individual.participants.remove.proposeRemoval"
                              )}
                    </span>
                </div>
            )}
        </div>
    );
};

const AddParticipantSchema = z.object({
    email: z.string().email(),
});

export const ContestParticipantsPage: FC = () => {
    const { contest, member } = useContestContext();

    const { data: members } = useAllContestMembers(contest.id);

    const addMutation = useAddParticipant(contest.id);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<z.infer<typeof AddParticipantSchema>>({
        resolver: zodResolver(AddParticipantSchema),
    });

    const onSubmit = handleSubmit((data) => {
        addMutation.reset();
        setNetError(false);
        addMutation.mutate(data.email);
    });

    const [netError, setNetError] = useState(false);

    const queryClient = useQueryClient();

    useEffect(() => {
        if (addMutation.isError) setNetError(true);

        if (addMutation.isSuccess)
            queryClient.invalidateQueries(["contests", contest.id, "members"]);
    }, [addMutation.isSuccess, addMutation.isError]);

    const { t } = useTranslation();

    return (
        <div tw={"w-full flex flex-col gap-4"}>
            <form onSubmit={onSubmit}>
                <div tw={"flex gap-4 items-end"}>
                    <TitledInput
                        label={t(
                            "contests.management.individual.participants.addParticipant.label"
                        )}
                        bigLabel
                        tw={"pt-0 max-w-full"}
                        placeholder={t(
                            "contests.management.individual.participants.addParticipant.placeholder"
                        )}
                        {...register("email")}
                    />
                    <SimpleButton>
                        {t("contests.management.individual.participants.addParticipant.addButton")}
                    </SimpleButton>
                </div>
            </form>
            <div tw={"text-red-500"}>
                {Object.keys(errors).length > 0 ? (
                    <span>
                        {t(
                            "contests.management.individual.participants.addParticipant.errorMessages.invalid"
                        )}
                    </span>
                ) : (
                    netError && (
                        <span>
                            {t(
                                "contests.management.individual.participants.addParticipant.errorMessages.double"
                            )}
                        </span>
                    )
                )}
            </div>
            {members && (
                <>
                    <MemberBox member={members.find((it) => it.id === member.id)!} admin />

                    <div tw={"w-[calc(100% + 1rem)] -mx-2 h-[1px] bg-neutral-600"}></div>
                </>
            )}
            {members
                ?.filter((it) => it.user_id !== member.user_id)
                .sort((a, b) => a.full_name.localeCompare(b.full_name))
                .map((member) => (
                    <MemberBox key={member.id.toString()} member={member} />
                ))}
        </div>
    );
};
