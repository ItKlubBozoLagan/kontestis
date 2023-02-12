import { Cluster } from "@kontestis/models";
import { Snowflake } from "@kontestis/models";
import { useQuery } from "react-query";

import { http, QueryHandler, wrapAxios } from "../../api/http";

export const useAllClusters: QueryHandler<Cluster[], Snowflake> = (problemId, options) =>
    useQuery({
        queryKey: ["clusters", problemId],
        queryFn: () => wrapAxios(http.get("/problem/cluster/" + problemId)),
        ...options,
    });
