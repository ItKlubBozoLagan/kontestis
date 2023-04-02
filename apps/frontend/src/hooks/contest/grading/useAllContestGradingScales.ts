import { ExamGradingScale, Snowflake } from "@kontestis/models";
import { useQuery } from "react-query";

import { http, QueryHandler, wrapAxios } from "../../../api/http";

export const useAllContestGradingScales: QueryHandler<ExamGradingScale[], Snowflake> = (
    contestId,
    ...options
) =>
    useQuery({
        queryKey: ["contest", contestId, "grades"],
        queryFn: () => wrapAxios(http.get(`/contest/${contestId}/grade/`)),
        ...options,
    });
