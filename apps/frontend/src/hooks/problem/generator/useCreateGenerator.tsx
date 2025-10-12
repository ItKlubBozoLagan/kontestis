import { Generator, Snowflake } from "@kontestis/models";
import { useMutation, useQueryClient } from "react-query";

import { http, MutationHandler, wrapAxios } from "../../../api/http";

type CreateGeneratorRequest = {
    name: string;
    code: string;
    language: string;
};

export const useCreateGenerator: MutationHandler<
    Generator,
    [Snowflake, CreateGeneratorRequest]
> = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ([problemId, data]: [Snowflake, CreateGeneratorRequest]) =>
            wrapAxios(http.post(`/problem/${problemId}/generator`, data)),
        onSuccess: (_, [problemId]) => {
            queryClient.invalidateQueries(["problem", problemId, "generator"]);
        },
    });
};
