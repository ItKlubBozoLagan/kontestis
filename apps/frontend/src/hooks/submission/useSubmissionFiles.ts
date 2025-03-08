import { Snowflake } from "@kontestis/models";
import { useQuery } from "react-query";

import { http, QueryHandler, wrapAxios } from "../../api/http";

export const useSubmissionFiles: QueryHandler<string[], [Snowflake, Snowflake]> = (
    [submission_id, cluster_id],
    options
) =>
    useQuery({
        queryKey: ["submission", submission_id, "files", cluster_id],
        queryFn: () => wrapAxios(http.get(`/submission/files/${submission_id}/${cluster_id}`)),
        ...options,
    });
