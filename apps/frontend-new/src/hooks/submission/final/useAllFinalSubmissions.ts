import { ExamFinalSubmissionWithProblemId, Snowflake } from "@kontestis/models";
import { useQuery } from "react-query";

import { http, QueryHandler, wrapAxios } from "../../../api/http";

export const useAllFinalSubmissions: QueryHandler<
    ExamFinalSubmissionWithProblemId[],
    [Snowflake, Snowflake]
> = ([contestId, userId], options) =>
    useQuery({
        queryKey: ["submission", "final", contestId, userId],
        queryFn: () =>
            wrapAxios(
                http.get("/submission/final/", {
                    params: { user_id: userId, contest_id: contestId },
                })
            ),
        ...options,
    });
