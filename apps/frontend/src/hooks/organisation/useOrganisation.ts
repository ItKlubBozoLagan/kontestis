import { Organisation, Snowflake } from "@kontestis/models";
import { useQuery } from "react-query";

import { http, QueryHandler, wrapAxios } from "../../api/http";

export const useOrganisation: QueryHandler<Organisation, Snowflake> = (organisationId, options) =>
    useQuery({
        queryKey: ["organisations", organisationId],
        queryFn: () => wrapAxios(http.get(`/organisation/${organisationId}`)),
        ...options,
    });
