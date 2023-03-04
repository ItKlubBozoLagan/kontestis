import { ContestAnnouncement, Snowflake } from "@kontestis/models";
import { useQuery } from "react-query";

import { http, QueryHandler, wrapAxios } from "../../../api/http";

export const useAllContestAnnouncements: QueryHandler<ContestAnnouncement[], Snowflake> = (
    contestId,
    ...options
) =>
    useQuery({
        queryKey: ["contests", contestId, "announcements"],
        queryFn: () => wrapAxios(http.get(`/contest/${contestId}/announcement/`)),
        ...options,
    });
