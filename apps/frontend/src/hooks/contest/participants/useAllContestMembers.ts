import { ContestMemberWithInfo, Snowflake } from "@kontestis/models";
import { useQuery } from "react-query";

import { http, QueryHandler, wrapAxios } from "../../../api/http";

export const useAllContestMembers: QueryHandler<
    ContestMemberWithInfo[],
    [Snowflake, { showAllUsers?: boolean }]
> = ([contest_id, leaderboardOptions], options) =>
    useQuery({
        queryKey: ["contests", contest_id, "members"],
        queryFn: () =>
            wrapAxios(
                http.get(
                    `/contest/${contest_id}/leaderboard?show_all_users=${
                        leaderboardOptions.showAllUsers ?? false
                    }`
                )
            ),
        ...options,
    });
