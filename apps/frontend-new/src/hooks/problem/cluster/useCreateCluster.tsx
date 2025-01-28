import { Cluster, Snowflake } from "@kontestis/models";
import { useMutation } from "react-query";

import { http, invalidateOnSuccess, MutationHandler, wrapAxios } from "../../../api/http";

type CreateClusterVariables = {
    awarded_score: number;
    generator: boolean;
    generator_language?: string;
    generator_code?: string;
};
// TODO: Make generators work
export const useCreateCluster: MutationHandler<CreateClusterVariables, Cluster, Snowflake> = (
    problemId,
    options
) =>
    useMutation(
        (variables) => wrapAxios(http.post(`/problem/${problemId}/cluster/`, variables)),
        invalidateOnSuccess([["clusters", problemId]], options)
    );

export const useModifyCluster: MutationHandler<
    CreateClusterVariables,
    Cluster,
    [Snowflake, Snowflake]
> = ([problemId, clusterId], options) =>
    useMutation(
        (variables) =>
            wrapAxios(http.patch(`/problem/${problemId}/cluster/${clusterId}`, variables)),
        invalidateOnSuccess(
            [
                ["clusters", problemId],
                ["problem", problemId, "cluster", clusterId],
            ],
            options
        )
    );
