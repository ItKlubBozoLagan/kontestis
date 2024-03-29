import { ProblemWithScore } from "@kontestis/models";
import { Snowflake } from "@kontestis/models";
import { useQuery } from "react-query";

import { http, QueryHandler, wrapAxios } from "../../api/http";

export const useAllProblems: QueryHandler<ProblemWithScore[], Snowflake | undefined> = (
    contestId,
    options
) =>
    useQuery({
        queryKey: contestId ? ["contests", contestId, "problems"] : ["problem"],
        queryFn: () =>
            wrapAxios(
                http.get("/problem", contestId ? { params: { contest_id: contestId } } : undefined)
            ),
        ...options,
    });
