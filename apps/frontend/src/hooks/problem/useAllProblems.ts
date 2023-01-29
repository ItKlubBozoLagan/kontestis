import { useQuery } from "react-query";

import { http, QueryHandler, wrapAxios } from "../../api/http";
import { ProblemType } from "../../types/ProblemType";
import { Snowflake } from "../../types/Snowflake";

export const useAllProblems: QueryHandler<
    ProblemType[],
    Snowflake | undefined
> = (contestId, options) =>
    useQuery({
        queryKey: contestId ? ["contest", contestId, "problem"] : ["problem"],
        queryFn: () =>
            wrapAxios(
                http.get(
                    "/problem",
                    contestId
                        ? { params: { contest_id: contestId } }
                        : undefined
                )
            ),
        ...options,
    });
