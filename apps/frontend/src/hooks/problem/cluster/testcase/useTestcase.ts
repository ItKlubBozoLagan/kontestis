import { Snowflake, Testcase } from "@kontestis/models";
import { useQuery } from "react-query";

import { http, QueryHandler, wrapAxios } from "../../../../api/http";

export const useTestcase: QueryHandler<Testcase, [Snowflake, Snowflake, Snowflake]> = (
    [problemId, clusterId, testcaseId],
    options
) =>
    useQuery({
        queryKey: ["problem", problemId, "cluster", clusterId, "testcase", testcaseId],
        queryFn: () =>
            wrapAxios(
                http.get(`/problem/${problemId}/cluster/${clusterId}/testcase/${testcaseId}`)
            ),
        ...options,
    });
