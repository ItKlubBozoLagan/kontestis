import { Snowflake } from "@kontestis/models";
import { Submission } from "@kontestis/models";
import { useQuery } from "react-query";

import { http, QueryHandler, wrapAxios } from "../../api/http";

export const useSubmission: QueryHandler<Submission, Snowflake> = (
    submissionId,
    options
) =>
    useQuery({
        queryKey: ["submission", submissionId],
        queryFn: () =>
            wrapAxios(http.get(`/submission/submission/${submissionId}`)),
        ...options,
    });
