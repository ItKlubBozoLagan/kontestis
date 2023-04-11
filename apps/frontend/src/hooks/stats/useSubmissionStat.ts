import { useQuery } from "react-query";

import { http, QueryHandler, wrapAxios } from "../../api/http";
import { LastStatistic } from "./types";

type Parameters = {
    accepted: boolean;
};

export const useSubmissionStat: QueryHandler<LastStatistic[], Parameters> = (
    { accepted },
    options
) =>
    useQuery({
        queryKey: ["stats", "submission", String(accepted)],
        queryFn: () => wrapAxios(http.get(`/stats/submissions?accepted=${accepted}`)),
        ...options,
    });
