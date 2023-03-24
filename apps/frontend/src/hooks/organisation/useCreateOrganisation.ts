import { Organisation, Snowflake } from "@kontestis/models";
import { useMutation } from "react-query";

import { http, MutationHandler, wrapAxios } from "../../api/http";

export type OrganisationVariables = {
    name: string;
};

export const useCreateOrganisation: MutationHandler<OrganisationVariables, Organisation> = (
    options
) => useMutation((variables) => wrapAxios(http.post("/organisation", variables)), options);

export const useModifyOrganisation: MutationHandler<
    OrganisationVariables,
    Organisation,
    Snowflake
> = (organisationId, options) =>
    useMutation(
        (variables) => wrapAxios(http.patch(`/organisation/${organisationId}`, variables)),
        options
    );
