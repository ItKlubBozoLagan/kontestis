import { useQuery } from "react-query";

import { http, QueryHandler, wrapAxios } from "../../api/http";
import { Snowflake } from "../../types/Snowflake";
import { SubmissionType } from "../../types/SubmissionType";

export const useAllProblemSubmissions: QueryHandler<
    SubmissionType[],
    [Snowflake]
> = (problemId) =>
    useQuery(["submission", "problem", problemId], () =>
        wrapAxios(http.get(`/submission/${problemId}`))
    );
