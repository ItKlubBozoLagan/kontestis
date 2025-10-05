import { Snowflake } from "@kontestis/models";
import { useMutation, useQueryClient } from "react-query";

import { http, MutationHandler, wrapAxios } from "../../../api/http";

export const useDeleteGenerator: MutationHandler<void, [Snowflake, Snowflake]> = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ([problemId, generatorId]: [Snowflake, Snowflake]) =>
            wrapAxios(http.delete(`/problem/${problemId}/generator/${generatorId}`)),
        onSuccess: (_, [problemId]) => {
            queryClient.invalidateQueries(["problem", problemId, "generator"]);
            queryClient.invalidateQueries(["problem", problemId, "cluster"]);
        },
    });
};
