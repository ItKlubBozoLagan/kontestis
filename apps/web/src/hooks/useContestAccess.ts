import { type Contest, ContestMemberPermissions } from "@kontestis/models";
import { useQuery } from "@tanstack/react-query";

import { useCurrentUser } from "@/api/auth";
import { contestQueries } from "@/api/contests";
import { useCurrentOrganisationMembership } from "@/api/organisations";
import { canInContest } from "@/lib/permissions";

/**
 * Permission check helper for one contest, combining site, organisation and contest member
 * permissions the same way the backend does. UI hint only.
 */
export const useContestAccess = (contest: Pick<Contest, "id">) => {
    const user = useCurrentUser();
    const { data: member } = useQuery(contestQueries.member(contest.id, user.id));
    const { data: organisationMember } = useCurrentOrganisationMembership();

    const can = (permission: ContestMemberPermissions) =>
        canInContest(
            user,
            member?.contest_permissions,
            organisationMember?.permissions,
            permission
        );

    return {
        member,
        can,
        isRegistered:
            !!member &&
            member.contest_permissions !== undefined &&
            BigInt(member.contest_permissions) !== 0n,
        canViewPrivate: can(ContestMemberPermissions.VIEW_PRIVATE),
        canEdit: can(ContestMemberPermissions.EDIT),
    };
};
