import { ContestMemberWithInfo } from "@kontestis/models";
import React, { FC, useEffect, useState } from "react";
import { useQueryClient } from "react-query";
import tw, { theme } from "twin.macro";

import { Breadcrumb } from "../../../../components/Breadcrumb";
import { DomainBreadcrumb } from "../../../../components/DomainBreadcrumb";
import { RankBreadcrumb } from "../../../../components/RankBreadcrumb";
import { useContestContext } from "../../../../context/constestContext";
import { useAllContestMembers } from "../../../../hooks/contest/participants/useAllContestMembers";
import { useRemoveParticipant } from "../../../../hooks/contest/participants/useRemoveParticipant";

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

    return (
        <div
            key={member.id.toString()}
            tw={"p-4 bg-neutral-200 flex justify-between border border-solid border-black"}
        >
            <div tw={"flex gap-2"}>
                {admin && <Breadcrumb color={theme`colors.red.400`}>Creator</Breadcrumb>}
                <DomainBreadcrumb email={member.email} />
                <RankBreadcrumb specificElo={member.elo} />
                {member.full_name}
            </div>
            {!admin && (
                <div tw={"flex items-center"}>
                    <span
                        tw={"text-red-600 cursor-pointer"}
                        css={
                            deleteMutation.isLoading || deleteMutation.isSuccess
                                ? tw`text-neutral-600`
                                : ""
                        }
                        onClick={onDeleteClick}
                    >
                        {confirmDelete ? "Confirm" : "Remove"}
                    </span>
                </div>
            )}
        </div>
    );
};

export const ContestParticipantsPage: FC = () => {
    const { contest, member } = useContestContext();

    const { data: members } = useAllContestMembers(contest.id);

    return (
        <div tw={"w-full flex flex-col gap-4"}>
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
