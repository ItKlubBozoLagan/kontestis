import { Snowflake } from "@kontestis/models";
import { Submission } from "@kontestis/models";
import { useQuery } from "react-query";

import { http, QueryHandler, wrapAxios } from "../../api/http";

export const useAllProblemSubmissions: QueryHandler<Submission[], Snowflake> = (
    problemId,
    options
) =>
    useQuery({
        queryKey: ["submission", "problem", problemId],
        queryFn: () => wrapAxios(http.get(`/submission/${problemId}`)),
        ...options,
    });
