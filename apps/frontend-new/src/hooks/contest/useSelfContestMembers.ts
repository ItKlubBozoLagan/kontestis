import { ContestMember } from "@kontestis/models";
import { useQuery } from "react-query";

import { http, QueryHandler, wrapAxios } from "../../api/http";

export const useSelfContestMembers: QueryHandler<ContestMember[]> = (...options) =>
    useQuery({
        queryKey: ["contests", "members", "self"],
        queryFn: () => wrapAxios(http.get("/contest/members/self")),
        ...options,
    });
