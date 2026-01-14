import { Generator, Snowflake } from "@kontestis/models";
import { useQuery } from "react-query";

import { http, QueryHandler, wrapAxios } from "../../../api/http";

export const useAllGenerators: QueryHandler<Generator[], [Snowflake]> = ([problemId], options) =>
    useQuery({
        queryKey: ["problem", problemId, "generator"],
        queryFn: () => wrapAxios(http.get(`/problem/${problemId}/generator`)),
        ...options,
    });
