import { OrganisationMember } from "@kontestis/models";
import { useQuery } from "react-query";

import { http, QueryHandler, wrapAxios } from "../../api/http";

export const useSelfOrganisationMembers: QueryHandler<OrganisationMember[]> = (options) =>
    useQuery({
        queryKey: ["organisations", "members", "self"],
        queryFn: () => wrapAxios(http.get("/organisation/members/self")),
        ...options,
    });
