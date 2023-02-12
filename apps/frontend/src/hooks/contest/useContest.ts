import { Contest } from "@kontestis/models";
import { Snowflake } from "@kontestis/models";
import { useQuery } from "react-query";

import { http, QueryHandler, wrapAxios } from "../../api/http";

export const useContest: QueryHandler<Contest, Snowflake> = (contestId, options) =>
    useQuery({
        queryKey: ["contests", contestId],
        queryFn: () => wrapAxios(http.get(`/contest/${contestId}`)),
        ...options,
    });
