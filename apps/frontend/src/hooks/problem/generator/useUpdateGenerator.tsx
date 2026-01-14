import { Generator, Snowflake } from "@kontestis/models";
import { useMutation } from "react-query";

import { http, invalidateOnSuccess, MutationHandler, wrapAxios } from "../../../api/http";

type UpdateGeneratorVariables = {
    name: string;
    code: string;
    language: string;
};

export const useUpdateGenerator: MutationHandler<
    UpdateGeneratorVariables,
    Generator,
    [Snowflake, Snowflake]
> = ([problemId, generatorId], options) =>
    useMutation(
        (data) => wrapAxios(http.patch(`/problem/${problemId}/generator/${generatorId}`, data)),
        invalidateOnSuccess(
            [
                ["problem", problemId, "generator"],
                ["problem", problemId, "generator", generatorId],
            ],
            options
        )
    );
