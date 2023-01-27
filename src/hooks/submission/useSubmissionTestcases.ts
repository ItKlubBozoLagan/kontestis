import { useQuery } from "react-query";

import { http, QueryHandler, wrapAxios } from "../../api/http";
import { Snowflake } from "../../types/Snowflake";
import { TestcaseSubmission } from "../../types/TestcaseSubmissionType";

export const useSubmissionTestcases: QueryHandler<
    TestcaseSubmission[],
    Snowflake
> = (cluster_submission_id, options) =>
    useQuery({
        queryKey: ["submission", "cluster", cluster_submission_id, "testcase"],
        queryFn: () =>
            wrapAxios(
                http.get(`/submission/testcase/${cluster_submission_id}`)
            ),
        ...options,
    });
