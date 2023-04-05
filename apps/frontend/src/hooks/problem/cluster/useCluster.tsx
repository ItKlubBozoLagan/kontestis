import { ClusterWithStatus, Snowflake } from "@kontestis/models";
import { useQuery } from "react-query";

import { http, QueryHandler, wrapAxios } from "../../../api/http";

export const useCluster: QueryHandler<ClusterWithStatus, [Snowflake, Snowflake]> = (
    [problemId, clusterId],
    options
) =>
    useQuery({
        queryKey: ["problem", problemId, "cluster", clusterId],
        queryFn: () => wrapAxios(http.get(`/problem/${problemId}/cluster/${clusterId}`)),
        ...options,
    });
