import { OrganisationMemberWithInfo, Snowflake } from "@kontestis/models";
import { useQuery } from "react-query";

import { http, QueryHandler, wrapAxios } from "../../api/http";

export const useAllOrganisationMembers: QueryHandler<OrganisationMemberWithInfo[], Snowflake> = (
    organisationId,
    options
) =>
    useQuery({
        queryKey: ["organisations", organisationId, "members"],
        queryFn: () => wrapAxios(http.get(`/organisation/${organisationId}/member`)),
        ...options,
    });
