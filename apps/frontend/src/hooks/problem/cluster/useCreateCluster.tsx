import { Cluster, Snowflake } from "@kontestis/models";
import { useMutation } from "react-query";

import { http, invalidateOnSuccess, MutationHandler, wrapAxios } from "../../../api/http";

type CreateClusterVariables = {
    awarded_score: number;
    is_sample?: boolean;
    generator_id?: string;
    test_count?: number;
};

export const useCreateCluster: MutationHandler<CreateClusterVariables, Cluster, Snowflake> = (
    problemId,
    options
) =>
    useMutation((variables) => {
        if (variables.is_sample) {
            variables.awarded_score = 0;
        }

        return wrapAxios(http.post(`/problem/${problemId}/cluster/`, variables));
    }, invalidateOnSuccess([["clusters", problemId]], options));

export const useModifyCluster: MutationHandler<
    Omit<CreateClusterVariables, "generator_id" | "test_count">,
    Cluster,
    [Snowflake, Snowflake]
> = ([problemId, clusterId], options) =>
    useMutation(
        (variables) => {
            if (variables.is_sample) {
                variables.awarded_score = 0;
            }

            return wrapAxios(http.patch(`/problem/${problemId}/cluster/${clusterId}`, variables));
        },
        invalidateOnSuccess(
            [
                ["clusters", problemId],
                ["problem", problemId, "cluster", clusterId],
            ],
            options
        )
    );
