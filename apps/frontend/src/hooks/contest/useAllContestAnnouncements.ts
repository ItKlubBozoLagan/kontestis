import { ContestAnnouncement, Snowflake } from "@kontestis/models";
import { useQuery } from "react-query";

import { http, QueryHandler, wrapAxios } from "../../api/http";

export const useAllContestAnnouncements: QueryHandler<ContestAnnouncement[], Snowflake> = (
    contest_id,
    ...options
) =>
    useQuery({
        queryKey: ["contests", contest_id, "announcements"],
        queryFn: () => wrapAxios(http.get("/contest/announcement/" + contest_id)),
        ...options,
    });
