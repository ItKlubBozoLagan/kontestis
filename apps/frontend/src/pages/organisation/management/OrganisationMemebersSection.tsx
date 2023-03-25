import { zodResolver } from "@hookform/resolvers/zod";
import { Organisation, OrganisationMemberWithInfo } from "@kontestis/models";
import React, { FC, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useQueryClient } from "react-query";
import tw, { theme } from "twin.macro";
import { z } from "zod";

import { Breadcrumb } from "../../../components/Breadcrumb";
import { DomainBreadcrumb } from "../../../components/DomainBreadcrumb";
import { SimpleButton } from "../../../components/SimpleButton";
import { TitledInput } from "../../../components/TitledInput";
import { useAddOrganisationMember } from "../../../hooks/organisation/useAddOrganisationMemeber";
import { useAllOrganisationMembers } from "../../../hooks/organisation/useAllOrganisationMembers";
import { useRemoveOrganisationMember } from "../../../hooks/organisation/useRemoveOrganisationMember";
import { useAuthStore } from "../../../state/auth";

type MemberBoxProperties = {
    member: OrganisationMemberWithInfo;
    organisation: Organisation;
};

const MemberBox: FC<MemberBoxProperties> = ({ member, organisation }) => {
    const [confirmDelete, setConfirmDelete] = useState(false);

    const deleteMutation = useRemoveOrganisationMember(organisation.id);

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

        queryClient.invalidateQueries(["organisations", organisation.id, "members"]);
    }, [deleteMutation]);

    return (
        <div
            key={member.id.toString()}
            tw={"p-4 bg-neutral-200 flex justify-between border border-solid border-black"}
        >
            <div tw={"flex gap-2"}>
                {member.user_id === organisation.owner && (
                    <Breadcrumb color={theme`colors.red.400`}>Owner</Breadcrumb>
                )}
                <DomainBreadcrumb email={member.email} />
                {member.full_name}
            </div>
            {!(member.user_id === organisation.owner) && (
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

type Properties = {
    organisation: Organisation;
};

const AddMemberSchema = z.object({
    email: z.string().email(),
});

export const OrganisationMembersSection: FC<Properties> = ({ organisation }) => {
    const { data: members } = useAllOrganisationMembers(organisation.id);

    const addMutation = useAddOrganisationMember(organisation.id);

    const { user } = useAuthStore();

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

    const [netError, setNetError] = useState(false);

    const queryClient = useQueryClient();

    useEffect(() => {
        if (addMutation.isError) setNetError(true);

        if (addMutation.isSuccess)
            queryClient.invalidateQueries(["organisation", organisation.id, "members"]);
    }, [addMutation.isSuccess, addMutation.isError]);

    return (
        <div tw={"w-full flex flex-col gap-4"}>
            <form onSubmit={onSubmit}>
                <div tw={"flex gap-4 items-end"}>
                    <TitledInput
                        label={"Add member"}
                        bigLabel
                        tw={"pt-0 max-w-full"}
                        placeholder={"example@skole.hr"}
                        {...register("email")}
                    />
                    <SimpleButton>Add</SimpleButton>
                </div>
            </form>
            <div tw={"text-red-500"}>
                {Object.keys(errors).length > 0 ? (
                    <span>Invalid email address!</span>
                ) : (
                    netError && <span>User doesn&apos;t exist or is already a member</span>
                )}
            </div>
            {members && (
                <>
                    <MemberBox
                        member={members.find((it) => it.user_id === organisation.owner)!}
                        organisation={organisation}
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
                    />
                ))}
        </div>
    );
};
