import { ClusterSubmission } from "@kontestis/models";
import { Snowflake } from "@kontestis/models";
import { useQuery } from "react-query";

import { http, QueryHandler, wrapAxios } from "../../api/http";

export const useSubmissionClusters: QueryHandler<
    ClusterSubmission[],
    Snowflake
> = (submissionId, options) =>
    useQuery({
        queryKey: ["submission", submissionId, "cluster"],
        queryFn: () =>
            wrapAxios(http.get(`/submission/cluster/${submissionId}`)),
        ...options,
    });
