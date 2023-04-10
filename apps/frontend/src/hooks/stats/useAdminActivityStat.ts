import { useQuery } from "react-query";

import { http, QueryHandler, wrapAxios } from "../../api/http";
import { CountStat, CountStatRange } from "./types";

type Parameter = {
    range: CountStatRange;
};

export const useAdminActivityStat: QueryHandler<CountStat[], Parameter> = ({ range }, options) =>
    useQuery({
        queryKey: ["stats", "admin", "activity", range],
        queryFn: () => wrapAxios(http.get(`/stats/admin/activity?range=${range}`)),
        ...options,
    });
