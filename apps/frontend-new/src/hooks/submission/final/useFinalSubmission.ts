import { ExamFinalSubmission, Snowflake } from "@kontestis/models";
import { useQuery } from "react-query";

import { http, QueryHandler, wrapAxios } from "../../../api/http";

export const useFinalSubmission: QueryHandler<ExamFinalSubmission, Snowflake> = (
    finalSubmissionId,
    options
) =>
    useQuery({
        queryKey: ["submission", "final", "submission", finalSubmissionId],
        queryFn: () => wrapAxios(http.get(`/submission/final/${finalSubmissionId}`)),
        ...options,
    });
