import { useQuery } from "react-query";

import { http, QueryHandler, wrapAxios } from "../../api/http";
import { Snowflake } from "../../types/Snowflake";
import { SubmissionType } from "../../types/SubmissionType";

export const useSubmission: QueryHandler<SubmissionType, Snowflake> = (
    submissionId,
    options
) =>
    useQuery({
        queryKey: ["submission", submissionId],
        queryFn: () =>
            wrapAxios(http.get(`/submission/submission/${submissionId}`)),
        ...options,
    });
