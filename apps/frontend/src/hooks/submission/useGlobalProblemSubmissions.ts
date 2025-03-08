import { Snowflake, SubmissionWithUserInfo } from "@kontestis/models";
import { useQuery } from "react-query";

import { http, QueryHandler, wrapAxios } from "../../api/http";

export type GlobalProblemSubmission = SubmissionWithUserInfo & {
    reevaluation: boolean;
};

export const useGlobalProblemSubmissions: QueryHandler<GlobalProblemSubmission[], Snowflake> = (
    problemId,
    options
) =>
    useQuery({
        queryKey: ["submission", "problem-global", problemId],
        queryFn: () => wrapAxios(http.get(`/submission/by-problem-all/${problemId}`)),
        ...options,
    });
