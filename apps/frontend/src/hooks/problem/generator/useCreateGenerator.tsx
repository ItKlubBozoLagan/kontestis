import { Generator, Snowflake } from "@kontestis/models";
import { useMutation } from "react-query";

import { http, invalidateOnSuccess, MutationHandler, wrapAxios } from "../../../api/http";

type CreateGeneratorVariables = {
    name: string;
    code: string;
    language: string;
};

export const useCreateGenerator: MutationHandler<CreateGeneratorVariables, Generator, Snowflake> = (
    problemId,
    options
) =>
    useMutation(
        (data) => wrapAxios(http.post(`/problem/${problemId}/generator`, data)),

        invalidateOnSuccess([["problem", problemId, "generator"]], options)
    );
