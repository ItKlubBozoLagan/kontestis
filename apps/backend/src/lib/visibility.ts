import {
    AdminPermissions,
    Contest,
    ContestMemberPermissions,
    ContestWithPermissions,
    hasAdminPermission,
    hasContestPermission,
    OrganisationPermissions,
} from "@kontestis/models";
import { Request } from "express";
import { hasPermission } from "permissio";

import { extractOptionalUser } from "../extractors/extractOptionalUser";
import { extractCurrentOrganisation } from "../extractors/extractOrganisation";
import { hasOrganisationPermission } from "../preconditions/hasPermission";
import { ContestWithMembership, Repositories } from "../repositories/Repositories";

const withMembership = ({
    member_contest_permissions: permissions,
    ...contest
}: ContestWithMembership): ContestWithPermissions => ({
    ...contest,
    registered:
        permissions !== null && hasContestPermission(permissions, ContestMemberPermissions.VIEW),
    permissions: permissions ?? 0n,
});

/**
 * Contests of the current organisation (or of a temporary user) visible to the requester,
 * annotated with the requester's membership. Shared by the contest list, problem list and
 * dashboard overview so they agree on visibility.
 */
export const listVisibleContests = async (req: Request): Promise<ContestWithPermissions[]> => {
    const optionalUser = await extractOptionalUser(req);

    if (optionalUser?.is_temporary) {
        const contests = await Repositories.contests.selectForTemporaryUser(optionalUser.id);

        return contests
            .filter(
                (contest) =>
                    contest.member_contest_permissions !== null &&
                    hasContestPermission(
                        contest.member_contest_permissions,
                        ContestMemberPermissions.VIEW
                    )
            )
            .map(withMembership);
    }

    const organisation = await extractCurrentOrganisation(req);

    const contests = await Repositories.contests.selectForOrganisationWithMembership(
        organisation.id,
        optionalUser?.id
    );

    const hasViewContestsPermission = await hasOrganisationPermission(
        req,
        OrganisationPermissions.VIEW_CONTEST,
        organisation.id
    );

    const isEduUser = optionalUser?.is_edu ?? false;

    return contests
        .filter((contest) => {
            if (hasViewContestsPermission) return true;

            if (contest.public && (!contest.require_edu_verification || isEduUser)) return true;

            return (
                contest.member_contest_permissions !== null &&
                hasContestPermission(
                    contest.member_contest_permissions,
                    ContestMemberPermissions.VIEW
                )
            );
        })
        .map(withMembership);
};

/**
 * Whether the requester may see problems of the contest before it starts. Mirrors the private
 * branch of `extractProblem` for an already visible contest.
 */
export const canViewPrivateContestData = async (
    req: Request,
    contest: Pick<Contest, "organisation_id"> & { permissions?: bigint }
) => {
    const user = await extractOptionalUser(req);

    if (!user) return false;

    if (hasAdminPermission(user.permissions, AdminPermissions.VIEW_CONTEST)) return true;

    if (
        contest.permissions !== undefined &&
        (hasPermission(contest.permissions, ContestMemberPermissions.VIEW_PRIVATE) ||
            hasPermission(contest.permissions, ContestMemberPermissions.ADMIN))
    )
        return true;

    return hasOrganisationPermission(
        req,
        OrganisationPermissions.EDIT_CONTEST,
        contest.organisation_id
    );
};

/** Contests whose problems are visible to the requester (started, or privately viewable). */
export const listContestsWithVisibleProblems = async (req: Request) => {
    const contests = await listVisibleContests(req);
    const now = Date.now();

    const visibility = await Promise.all(
        contests.map(
            async (contest) =>
                contest.start_time.getTime() <= now ||
                (await canViewPrivateContestData(req, contest))
        )
    );

    return contests.filter((_, index) => visibility[index]);
};
