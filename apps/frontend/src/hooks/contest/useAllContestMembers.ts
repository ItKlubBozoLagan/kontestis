import { ContestMember, Snowflake } from "@kontestis/models";
import { useQuery } from "react-query";

import { http, QueryHandler, wrapAxios } from "../../api/http";

export const useAllContestMembers: QueryHandler<
    (ContestMember & {
        full_name: string;
    })[],
    Snowflake
> = (contest_id, ...options) =>
    useQuery({
        queryKey: ["contest", contest_id, "members"],
        queryFn: () => wrapAxios(http.get("/contest/leaderboard/" + contest_id)),
        ...options,
    });
