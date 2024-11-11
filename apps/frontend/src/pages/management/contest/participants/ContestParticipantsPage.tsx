import { zodResolver } from "@hookform/resolvers/zod";
import {
    AdminPermissions,
    ContestMemberPermissions,
    ContestMemberWithInfo,
    hasAdminPermission,
    hasContestPermission,
} from "@kontestis/models";
import React, { FC, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import tw, { theme } from "twin.macro";
import { z } from "zod";

import { Breadcrumb } from "../../../../components/Breadcrumb";
import { DomainBreadcrumb } from "../../../../components/DomainBreadcrumb";
import { PermissionsModal } from "../../../../components/PermissionsModal";
import { RankBreadcrumb } from "../../../../components/RankBreadcrumb";
import { SimpleButton } from "../../../../components/SimpleButton";
import { TitledInput } from "../../../../components/TitledInput";
import { useContestContext } from "../../../../context/constestContext";
import { useAddParticipant } from "../../../../hooks/contest/participants/useAddParticipant";
import { useAllContestMembers } from "../../../../hooks/contest/participants/useAllContestMembers";
import { useModifyContestMember } from "../../../../hooks/contest/participants/useModifyContestMember";
import { useRemoveParticipant } from "../../../../hooks/contest/participants/useRemoveParticipant";
import { useTranslation } from "../../../../hooks/useTranslation";
import { useAuthStore } from "../../../../state/auth";

type MemberBoxProperties = {
    member: ContestMemberWithInfo;
    admin?: boolean;
};

const MemberBox: FC<MemberBoxProperties> = ({ member, admin }) => {
    const { contest, member: editMember } = useContestContext();
    const { user } = useAuthStore();

    const [confirmDelete, setConfirmDelete] = useState(false);

    const deleteMutation = useRemoveParticipant(contest.id);

    const onDeleteClick = () => {
        if (deleteMutation.isLoading) return;

        if (!confirmDelete) {
            setConfirmDelete(true);

            return;
        }

        deleteMutation.mutate(member.user_id);
    };

    const [modalOpen, setModalOpen] = useState(false);

    const modifyMutation = useModifyContestMember([contest.id, member.user_id]);

    useEffect(() => {
        if (!modifyMutation.isSuccess) return;

        modifyMutation.reset();
    }, [modifyMutation]);

    const { t } = useTranslation();

    return (
        <div
            key={member.id.toString()}
            tw={"p-4 bg-neutral-200 flex justify-between border border-solid border-neutral-400"}
        >
            <PermissionsModal
                isOpen={modalOpen}
                onRequestClose={() => setModalOpen(false)}
                onAfterClose={() => setModalOpen(false)}
                permissions={member.contest_permissions}
                type={"contest_member"}
                editor_permission={
                    hasAdminPermission(user.permissions, AdminPermissions.EDIT_CONTEST)
                        ? 1n
                        : editMember
                        ? hasContestPermission(
                              editMember.contest_permissions,
                              ContestMemberPermissions.EDIT_USER_PERMISSIONS
                          )
                            ? editMember.contest_permissions
                            : 0n
                        : 0n
                }
                onSave={(data) => {
                    modifyMutation.mutate({
                        contest_permissions: data,
                    });
                }}
            />
            <div tw={"flex gap-2"}>
                {admin && (
                    <Breadcrumb color={theme`colors.red.400`}>
                        {t("account.breadcrumbs.creator")}
                    </Breadcrumb>
                )}
                <DomainBreadcrumb email={member.email_domain} />
                <RankBreadcrumb specificElo={member.elo} />
                {member.full_name}
            </div>
            <div tw={"flex items-center gap-4"}>
                <div
                    tw={"text-red-600 cursor-pointer select-none"}
                    onClick={() => setModalOpen(true)}
                >
                    {t("contests.management.individual.participants.permissions.editButton")}
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
        </div>
    );
};

const AddParticipantSchema = z.object({
    email: z.string().email(),
});

export const ContestParticipantsPage: FC = () => {
    const { contest } = useContestContext();

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

    useEffect(() => {
        if (!addMutation.isError) return;

        setNetError(true);
    }, [addMutation.isError]);

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
                    {members
                        ?.filter((it) =>
                            hasContestPermission(
                                it.contest_permissions,
                                ContestMemberPermissions.ADMIN
                            )
                        )
                        .sort((a, b) => a.full_name.localeCompare(b.full_name))
                        .map((member) => (
                            <MemberBox key={member.id.toString()} member={member} admin />
                        ))}

                    <div tw={"w-[calc(100% + 1rem)] -mx-2 h-[1px] bg-neutral-600"}></div>
                </>
            )}
            {members
                ?.filter(
                    (it) =>
                        !hasContestPermission(
                            it.contest_permissions,
                            ContestMemberPermissions.ADMIN
                        )
                )
                .sort((a, b) => a.full_name.localeCompare(b.full_name))
                .map((member) => (
                    <MemberBox key={member.id.toString()} member={member} />
                ))}
        </div>
    );
};
