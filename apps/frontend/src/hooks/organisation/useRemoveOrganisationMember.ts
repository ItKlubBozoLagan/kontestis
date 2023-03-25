import { Snowflake } from "@kontestis/models";
import { useMutation } from "react-query";

import { http, MutationHandler, wrapAxios } from "../../api/http";

export const useRemoveOrganisationMember: MutationHandler<Snowflake, undefined, Snowflake> = (
    organisationId,
    options
) =>
    useMutation(
        (userId) => wrapAxios(http.delete(`/organisation/${organisationId}/member/${userId}`)),
        options
    );
