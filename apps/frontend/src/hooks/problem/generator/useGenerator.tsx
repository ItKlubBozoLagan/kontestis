import { Generator, Snowflake } from "@kontestis/models";
import { useQuery } from "react-query";

import { http, QueryHandler, wrapAxios } from "../../../api/http";

export const useGenerator: QueryHandler<Generator, [Snowflake, Snowflake]> = (
    [problemId, generatorId],
    options
) =>
    useQuery({
        queryKey: ["problem", problemId, "generator", generatorId],
        queryFn: () => wrapAxios(http.get(`/problem/${problemId}/generator/${generatorId}`)),
        ...options,
    });
