import {
    ContestMember,
    ContestMemberPermissions,
    hasContestPermission,
    Snowflake,
} from "@kontestis/models";
import { useMemo } from "react";

import { useAuthStore } from "../../state/auth";
import { useSelfOrganisationMembers } from "../organisation/useSelfOrganisationMembers";
import { useSelfContestMembers } from "./useSelfContestMembers";

export const useContestPermission = (
    permission: ContestMemberPermissions,
    contest: { id: Snowflake; organisation_id: Snowflake } | undefined,
    member?: ContestMember
): boolean => {
    const { user } = useAuthStore();
    const { data: selfContestMembers } = useSelfContestMembers();
    const { data: selfOrgMembers } = useSelfOrganisationMembers();

    return useMemo(() => {
        if (!contest) return false;

        const contestMember =
            member ?? selfContestMembers?.find((m) => m.contest_id === contest.id);
        const orgMember = selfOrgMembers?.find(
            (m) => m.organisation_id === contest.organisation_id
        );

        return hasContestPermission(
            contestMember?.contest_permissions ?? 0n,
            permission,
            orgMember?.permissions,
            user.permissions
        );
    }, [contest, member, selfContestMembers, selfOrgMembers, permission, user.permissions]);
};
