import { ContestMemberWithInfo, Snowflake } from "@kontestis/models";
import { useQuery } from "react-query";

import { http, QueryHandler, wrapAxios } from "../../../api/http";

export const useAllContestMembers: QueryHandler<ContestMemberWithInfo[], Snowflake> = (
    contest_id,
    ...options
) =>
    useQuery({
        queryKey: ["contests", contest_id, "members"],
        queryFn: () => wrapAxios(http.get(`/contest/${contest_id}/leaderboard`)),
        ...options,
    });
