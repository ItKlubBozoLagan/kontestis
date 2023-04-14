import { Snowflake } from "@kontestis/models";
import { useMutation } from "react-query";

import { http, invalidateOnSuccess, MutationHandler, wrapAxios } from "../../api/http";

export const useAddOrganisationMember: MutationHandler<string, undefined, Snowflake> = (
    organisationId,
    options
) =>
    useMutation(
        (email) => wrapAxios(http.post(`/organisation/${organisationId}/member`, { email })),
        invalidateOnSuccess([["organisations", organisationId.toString(), "members"]], options)
    );
