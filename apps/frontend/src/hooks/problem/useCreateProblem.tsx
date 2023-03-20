import { EvaluationVariant, Problem, Snowflake } from "@kontestis/models";
import { useMutation } from "react-query";

import { http, MutationHandler, wrapAxios } from "../../api/http";

type CreateProblemVariables = {
    title: string;
    description: string;
    evaluation_variant: EvaluationVariant;
    evaluation_script?: string;
    time_limit_millis: number;
    memory_limit_megabytes: number;
};

export const useCreateProblem: MutationHandler<CreateProblemVariables, Problem, Snowflake> = (
    contestId,
    options
) => useMutation((variables) => wrapAxios(http.post("/problem/" + contestId, variables)), options);

export const useModifyProblem: MutationHandler<CreateProblemVariables, Problem, Snowflake> = (
    problemId,
    options
) => useMutation((variables) => wrapAxios(http.patch("/problem/" + problemId, variables)), options);
