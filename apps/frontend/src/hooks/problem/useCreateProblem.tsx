import { Problem, Snowflake } from "@kontestis/models";
import { useMutation } from "react-query";

import { http, invalidateOnSuccess, MutationHandler, wrapAxios } from "../../api/http";

type CreateProblemVariables = {
    title: string;
    description: string;
    evaluation_variant: string;
    evaluation_language: string;
    evaluation_script?: string;
    time_limit_millis: number;
    memory_limit_megabytes: number;
    solution_language: string;
    solution_code: string;
    tags: string[];
};

export const useCreateProblem: MutationHandler<CreateProblemVariables, Problem, Snowflake> = (
    contestId,
    options
) =>
    useMutation(
        (variables) => wrapAxios(http.post("/problem/" + contestId, variables)),
        invalidateOnSuccess([["contests", contestId, "problems"]], options)
    );

export const useModifyProblem: MutationHandler<
    CreateProblemVariables,
    Problem,
    [Snowflake, Snowflake]
> = ([contestId, problemId], options) =>
    useMutation(
        (variables) => wrapAxios(http.patch("/problem/" + problemId, variables)),
        invalidateOnSuccess(
            [
                ["contests", contestId, "problems"],
                ["problem", problemId],
            ],
            options
        )
    );
