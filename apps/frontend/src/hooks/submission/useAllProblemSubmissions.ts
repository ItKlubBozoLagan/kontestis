import { useQuery } from "react-query";

import { http, QueryHandler, wrapAxios } from "../../api/http";
import { Snowflake } from "../../types/Snowflake";
import { SubmissionType } from "../../types/SubmissionType";

export const useAllProblemSubmissions: QueryHandler<
    SubmissionType[],
    Snowflake
> = (problemId, options) =>
    useQuery({
        queryKey: ["submission", "problem", problemId],
        queryFn: () => wrapAxios(http.get(`/submission/${problemId}`)),
        ...options,
    });
