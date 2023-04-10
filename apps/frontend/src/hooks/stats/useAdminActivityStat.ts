import { useQuery } from "react-query";

import { http, QueryHandler, wrapAxios } from "../../api/http";
import { CountStat, CountStatRange } from "./types";

type Parameters = {
    range: CountStatRange;
};

export const useAdminActivityStat: QueryHandler<CountStat[], Parameters> = ({ range }, options) =>
    useQuery({
        queryKey: ["stats", "admin", "activity", range],
        queryFn: () => wrapAxios(http.get(`/stats/admin/activity?range=${range}`)),
        ...options,
    });
