import { Snowflake } from "@kontestis/models";
import { useMutation } from "react-query";

import { http, invalidateOnSuccess, MutationHandler, wrapAxios } from "../../api/http";

type OrganisationMemberVariables = {
    permissions: bigint;
    elo: number;
};

export const useModifyOrganisationMember: MutationHandler<
    OrganisationMemberVariables,
    undefined,
    [Snowflake, Snowflake]
> = ([organisationId, userId], options) =>
    useMutation(
        (variables) =>
            wrapAxios(http.patch(`/organisation/${organisationId}/member/${userId}`, variables)),
        invalidateOnSuccess([["organisations", organisationId, "members"]], options)
    );
