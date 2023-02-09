import { useQuery } from "react-query";

import { http, QueryHandler, wrapAxios } from "../../api/http";

export const useAllProblemScores: QueryHandler<Record<string, number>> = (...options) =>
    useQuery({
        queryKey: ["scores"],
        queryFn: () => wrapAxios<Record<string, number>>(http.get("/problem/scores")),
        ...options,
    });
