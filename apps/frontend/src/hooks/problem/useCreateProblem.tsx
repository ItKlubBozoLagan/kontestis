import { Problem, Snowflake } from "@kontestis/models";
import { useMutation } from "react-query";

import { http, MutationHandler, wrapAxios } from "../../api/http";

type CreateProblemVariables = {
    name: string;
};

export const useCreateProblem: MutationHandler<CreateProblemVariables, Problem, Snowflake> = (
    contestId,
    options
) => useMutation((variables) => wrapAxios(http.post("/problem/" + contestId, variables)), options);
