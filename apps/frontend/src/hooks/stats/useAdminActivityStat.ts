import { useQuery } from "react-query";

import { http, QueryHandler, wrapAxios } from "../../api/http";
import { CountStatRange, CountStatWithPeriod } from "./types";

type Parameters = {
    range: CountStatRange;
};

export const useAdminActivityStat: QueryHandler<CountStatWithPeriod, Parameters> = (
    { range },
    options
) =>
    useQuery({
        queryKey: ["stats", "admin", "activity", range],
        queryFn: () => wrapAxios(http.get(`/stats/admin/activity?range=${range}`)),
        ...options,
    });
