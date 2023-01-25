import { useQuery } from "react-query";

import { http, QueryHandler, wrapAxios } from "../../api/http";
import { ClusterSubmissionType } from "../../types/ClusterSubmissionType";
import { Snowflake } from "../../types/Snowflake";

export const useSubmissionClusters: QueryHandler<
    ClusterSubmissionType[],
    [Snowflake]
> = (submissionId) =>
    useQuery(["submission", submissionId, "cluster"], () =>
        wrapAxios(http.get(`/submission/cluster/${submissionId}`))
    );
