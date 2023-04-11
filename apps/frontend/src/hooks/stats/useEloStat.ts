import { useQuery } from "react-query";

import { http, QueryHandler, wrapAxios } from "../../api/http";
import { LastStatistic, StatisticRange } from "./types";

export const useEloStat: QueryHandler<LastStatistic[], StatisticRange> = (range, options) =>
    useQuery({
        queryKey: ["stats", "elo", range],
        queryFn: () => wrapAxios(http.get(`/stats/elo?range=${range}`)),
        ...options,
    });
