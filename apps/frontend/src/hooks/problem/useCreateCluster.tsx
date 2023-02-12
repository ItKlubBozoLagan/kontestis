import { Cluster, Snowflake } from "@kontestis/models";
import { useMutation } from "react-query";

import { http, MutationHandler, wrapAxios } from "../../api/http";

type CreateClusterVariables = {
    awarded_score: number;
};

export const useCreateCluster: MutationHandler<CreateClusterVariables, Cluster, Snowflake> = (
    problemId,
    options
) =>
    useMutation(
        (variables) => wrapAxios(http.post("/problem/cluster/" + problemId, variables)),
        options
    );
