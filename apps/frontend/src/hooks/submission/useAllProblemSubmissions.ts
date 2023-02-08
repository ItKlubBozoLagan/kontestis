import { Snowflake, SubmissionByProblemResponse } from "@kontestis/models";
import { useQuery } from "react-query";

import { http, QueryHandler, wrapAxios } from "../../api/http";

export const useAllProblemSubmissions: QueryHandler<
    SubmissionByProblemResponse[],
    Snowflake
> = (problemId, options) =>
    useQuery({
        queryKey: ["submission", "problem", problemId],
        queryFn: () =>
            wrapAxios(http.get(`/submission/by-problem/${problemId}`)),
        ...options,
    });
