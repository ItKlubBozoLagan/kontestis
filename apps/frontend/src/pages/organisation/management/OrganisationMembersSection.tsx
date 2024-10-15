import { zodResolver } from "@hookform/resolvers/zod";
import {
    AdminPermissions,
    hasAdminPermission,
    Organisation,
    OrganisationMemberWithInfo,
    OrganisationPermissions,
} from "@kontestis/models";
import { EMPTY_PERMISSIONS, grantPermission, hasPermission, PermissionData } from "permissio";
import React, { FC, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import tw, { theme } from "twin.macro";
import { z } from "zod";

import { Breadcrumb } from "../../../components/Breadcrumb";
import { DomainBreadcrumb } from "../../../components/DomainBreadcrumb";
import { PermissionsModal } from "../../../components/PermissionsModal";
import { SimpleButton } from "../../../components/SimpleButton";
import { TitledInput } from "../../../components/TitledInput";
import { useAddOrganisationMember } from "../../../hooks/organisation/useAddOrganisationMemeber";
import { useAllOrganisationMembers } from "../../../hooks/organisation/useAllOrganisationMembers";
import { useModifyOrganisationMember } from "../../../hooks/organisation/useModifyOrganisationMember";
import { useRemoveOrganisationMember } from "../../../hooks/organisation/useRemoveOrganisationMember";
import { useTranslation } from "../../../hooks/useTranslation";
import { useAuthStore } from "../../../state/auth";

type MemberBoxProperties = {
    member: OrganisationMemberWithInfo;
    editorPermissions: PermissionData;
    organisation: Organisation;
};

// TODO: Refactor shared parts from contest management
const MemberBox: FC<MemberBoxProperties> = ({ member, organisation, editorPermissions }) => {
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);

    const deleteMutation = useRemoveOrganisationMember(organisation.id);
    const modifyMutation = useModifyOrganisationMember([organisation.id, member.user_id]);

    const { t } = useTranslation();

    const { user } = useAuthStore();

    const onDeleteClick = () => {
        if (deleteMutation.isLoading) return;

        if (!confirmDelete) {
            setConfirmDelete(true);

            return;
        }

        deleteMutation.mutate(member.user_id);
    };

    return (
        <div
            key={member.id.toString()}
            tw={"p-4 bg-neutral-200 flex justify-between border border-solid border-black"}
        >
            <PermissionsModal
                isOpen={modalOpen}
                onRequestClose={() => setModalOpen(false)}
                onAfterClose={() => setModalOpen(false)}
                permissions={member.permissions}
                type={"organisation_member"}
                editor_permission={editorPermissions}
                onSave={(permissions) => {
                    modifyMutation.mutate({
                        permissions: BigInt(permissions),
                        elo: member.elo,
                    });
                }}
            />
            <div tw={"flex gap-2"}>
                {member.user_id === organisation.owner && (
                    <Breadcrumb color={theme`colors.red.400`}>
                        {t("account.breadcrumbs.owner")}
                    </Breadcrumb>
                )}
                {hasPermission(member.permissions, OrganisationPermissions.ADMIN) && (
                    <Breadcrumb color={theme`colors.purple.500`}>
                        {t("account.breadcrumbs.organisationAdmin")}
                    </Breadcrumb>
                )}
                <DomainBreadcrumb email={member.email_domain} />
                {member.full_name}
            </div>
            {!(member.user_id === organisation.owner) && (
                <div tw={"flex items-center gap-3"}>
                    {member.user_id !== user.id && (
                        <div
                            tw={"text-red-600 cursor-pointer select-none"}
                            onClick={() => setModalOpen(true)}
                        >
                            {t("admin.users.editPermission")}
                        </div>
                    )}
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
                            ? t("organisations.management.members.remove.confirm")
                            : t("organisations.management.members.remove.proposeRemoval")}
                    </span>
                </div>
            )}
        </div>
    );
};

type Properties = {
    organisation: Organisation;
};

const AddMemberSchema = z.object({
    email: z.string().email(),
});

// TODO: Refactor shared parts with contest management
export const OrganisationMembersSection: FC<Properties> = ({ organisation }) => {
    const { data: members } = useAllOrganisationMembers(organisation.id);

    const user = useAuthStore();

    const addMutation = useAddOrganisationMember(organisation.id);
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<z.infer<typeof AddMemberSchema>>({
        resolver: zodResolver(AddMemberSchema),
    });

    const onSubmit = handleSubmit((data) => {
        addMutation.reset();
        setNetError(false);
        addMutation.mutate(data.email);
    });

    const editor = useMemo(
        () => (members ?? []).find((x) => x.user_id === user.user.id),
        [members, user]
    );

    const hasAdminEditPerms = hasAdminPermission(
        user.user.permissions,
        AdminPermissions.EDIT_ORGANISATIONS
    );

    const [netError, setNetError] = useState(false);

    const { t } = useTranslation();

    useEffect(() => {
        if (!addMutation.isError) return;

        setNetError(true);
    }, [addMutation.isError]);

    return (
        <div tw={"w-full flex flex-col gap-4"}>
            <form onSubmit={onSubmit}>
                <div tw={"flex gap-4 items-end"}>
                    <TitledInput
                        label={t("organisations.management.members.add.label")}
                        bigLabel
                        tw={"pt-0 max-w-full"}
                        placeholder={t("organisations.management.members.add.placeholder")}
                        {...register("email")}
                    />
                    <SimpleButton>
                        {t("organisations.management.members.add.addButton")}
                    </SimpleButton>
                </div>
            </form>
            <div tw={"text-red-500"}>
                {Object.keys(errors).length > 0 ? (
                    <span>{t("organisations.management.members.add.errorMessages.invalid")}</span>
                ) : (
                    netError && (
                        <span>
                            {t("organisations.management.members.add.errorMessages.double")}
                        </span>
                    )
                )}
            </div>
            {members && (
                <>
                    <MemberBox
                        member={members.find((it) => it.user_id === organisation.owner)!}
                        organisation={organisation}
                        editorPermissions={editor?.permissions ?? EMPTY_PERMISSIONS}
                    />

                    <div tw={"w-[calc(100% + 1rem)] -mx-2 h-[1px] bg-neutral-600"}></div>
                </>
            )}
            {members
                ?.filter((it) => it.user_id !== organisation.owner)
                .sort((a, b) => a.full_name.localeCompare(b.full_name))
                .map((member) => (
                    <MemberBox
                        key={member.id.toString()}
                        member={member}
                        organisation={organisation}
                        editorPermissions={
                            hasAdminEditPerms
                                ? grantPermission(EMPTY_PERMISSIONS, OrganisationPermissions.ADMIN)
                                : editor?.permissions ?? EMPTY_PERMISSIONS
                        }
                    />
                ))}
        </div>
    );
};
