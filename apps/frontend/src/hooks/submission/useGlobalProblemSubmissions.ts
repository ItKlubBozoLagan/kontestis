import { Snowflake, Submission } from "@kontestis/models";
import { useQuery } from "react-query";

import { http, QueryHandler, wrapAxios } from "../../api/http";

export const useGlobalProblemSubmissions: QueryHandler<Submission[], Snowflake> = (
    problemId,
    options
) =>
    useQuery({
        queryKey: ["submission", "problem-global", problemId],
        queryFn: () => wrapAxios(http.get(`/submission/by-problem-all/${problemId}`)),
        ...options,
    });
