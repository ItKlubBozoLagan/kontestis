import { useQuery } from "react-query";

import { http, QueryHandler, wrapAxios } from "../../api/http";
import { CountStatisticRange, CountStatisticWithPeriod } from "./types";

type Parameters = {
    range: CountStatisticRange;
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
