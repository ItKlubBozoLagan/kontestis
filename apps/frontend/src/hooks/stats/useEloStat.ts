import { useQuery } from "react-query";

import { http, QueryHandler, wrapAxios } from "../../api/http";
import { CountStatistic, CountStatisticRange } from "./types";

export const useEloStat: QueryHandler<CountStatistic[], CountStatisticRange> = (range, options) =>
    useQuery({
        queryKey: ["stats", "elo", range],
        queryFn: () => wrapAxios(http.get(`/stats/elo?range=${range}`)),
        ...options,
    });
