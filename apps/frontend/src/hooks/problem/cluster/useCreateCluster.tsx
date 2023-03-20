import { Cluster, Snowflake } from "@kontestis/models";
import { useMutation } from "react-query";

import { http, MutationHandler, wrapAxios } from "../../../api/http";

type CreateClusterVariables = {
    awarded_score: number;
};

export const useCreateCluster: MutationHandler<CreateClusterVariables, Cluster, Snowflake> = (
    problemId,
    options
) =>
    useMutation(
        (variables) => wrapAxios(http.post(`/problem/${problemId}/cluster/`, variables)),
        options
    );

export const useModifyCluster: MutationHandler<
    CreateClusterVariables,
    Cluster,
    [Snowflake, Snowflake]
> = ([problemId, clusterId], options) =>
    useMutation(
        (variables) =>
            wrapAxios(http.patch(`/problem/${problemId}/cluster/${clusterId}`, variables)),
        options
    );
