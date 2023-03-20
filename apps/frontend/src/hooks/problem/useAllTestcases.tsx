import { Testcase } from "@kontestis/models";
import { Snowflake } from "@kontestis/models";
import { useQuery } from "react-query";

import { http, QueryHandler, wrapAxios } from "../../api/http";

export const useAllTestcases: QueryHandler<Testcase[], [Snowflake, Snowflake]> = (
    [problemId, clusterId],
    options
) =>
    useQuery({
        queryKey: ["testcases", problemId, clusterId],
        queryFn: () => wrapAxios(http.get(`/problem/${problemId}/cluster/${clusterId}/testcase/`)),
        ...options,
    });
