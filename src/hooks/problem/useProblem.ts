import { useQuery } from "react-query";

import { http, QueryHandler, wrapAxios } from "../../api/http";
import { ProblemType } from "../../types/ProblemType";
import { Snowflake } from "../../types/Snowflake";

export const useProblem: QueryHandler<ProblemType, Snowflake> = (
    problemId,
    options
) =>
    useQuery({
        queryKey: ["problem", problemId],
        queryFn: () => wrapAxios(http.get(`/problem/${problemId}`)),
        ...options,
    });
