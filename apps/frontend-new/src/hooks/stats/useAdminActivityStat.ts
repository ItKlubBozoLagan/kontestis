import { useQuery } from "react-query";

import { http, QueryHandler, wrapAxios } from "../../api/http";
import { CountStatisticWithPeriod, StatisticRange } from "./types";

type Parameters = {
    range: StatisticRange;
};

export const useAdminActivityStat: QueryHandler<CountStatisticWithPeriod, Parameters> = (
    { range },
    options
) =>
    useQuery({
        queryKey: ["stats", "admin", "activity", range],
        queryFn: () => wrapAxios(http.get(`/stats/admin/activity?range=${range}`)),
        ...options,
    });
