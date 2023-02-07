import { Problem } from "@kontestis/models";
import { Snowflake } from "@kontestis/models";
import { useQuery } from "react-query";

import { http, QueryHandler, wrapAxios } from "../../api/http";

export const useAllProblems: QueryHandler<Problem[], Snowflake | undefined> = (
    contestId,
    options
) =>
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
