import { Organisation, Snowflake } from "@kontestis/models";
import { useQuery } from "react-query";

import { http, QueryHandler, wrapAxios } from "../../api/http";

export const useAllOrganisationMembers: QueryHandler<Organisation[], Snowflake> = (
    organisationId,
    options
) =>
    useQuery({
        queryKey: ["organisations", organisationId, "members"],
        queryFn: () => wrapAxios(http.get(`/organisation/${organisationId}/member`)),
        ...options,
    });
