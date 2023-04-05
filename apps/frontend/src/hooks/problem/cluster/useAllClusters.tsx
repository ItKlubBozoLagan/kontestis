import { ClusterWithStatus, Snowflake } from "@kontestis/models";
import { useQuery } from "react-query";

import { http, QueryHandler, wrapAxios } from "../../../api/http";

export const useAllClusters: QueryHandler<ClusterWithStatus[], Snowflake> = (problemId, options) =>
    useQuery({
        queryKey: ["clusters", problemId],
        queryFn: () => wrapAxios(http.get(`/problem/${problemId}/cluster/`)),
        ...options,
    });
