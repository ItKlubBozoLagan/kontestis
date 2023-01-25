import { useQuery } from "react-query";

import { http, QueryHandler, wrapAxios } from "../../api/http";
import { Snowflake } from "../../types/Snowflake";
import { SubmissionType } from "../../types/SubmissionType";

export const useSubmission: QueryHandler<SubmissionType, [Snowflake]> = (
    submissionId
) =>
    useQuery(["submission", submissionId], () =>
        wrapAxios(http.get(`/submission/submission/${submissionId}`))
    );
