import { Snowflake } from "@kontestis/models";
import { useMutation, useQueryClient } from "react-query";

import { http, MutationHandler, wrapAxios } from "../../../api/http";

type UpdateGeneratorRequest = {
    name: string;
    code: string;
    language: string;
};

export const useUpdateGenerator: MutationHandler<
    void,
    [Snowflake, Snowflake, UpdateGeneratorRequest]
> = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ([problemId, generatorId, data]: [
            Snowflake,
            Snowflake,
            UpdateGeneratorRequest
        ]) => wrapAxios(http.patch(`/problem/${problemId}/generator/${generatorId}`, data)),
        onSuccess: (_, [problemId, generatorId]) => {
            queryClient.invalidateQueries(["problem", problemId, "generator", generatorId]);
            queryClient.invalidateQueries(["problem", problemId, "generator"]);
        },
    });
};
