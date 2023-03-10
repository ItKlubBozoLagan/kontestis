import { ProblemWithScore } from "@kontestis/models";
import { Snowflake } from "@kontestis/models";
import { useQuery } from "react-query";

import { http, QueryHandler, wrapAxios } from "../../api/http";

export const useProblem: QueryHandler<ProblemWithScore, Snowflake> = (problemId, options) =>
    useQuery({
        queryKey: ["problem", problemId],
        queryFn: () => wrapAxios(http.get(`/problem/${problemId}`)),
        ...options,
    });
