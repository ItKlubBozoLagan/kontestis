import { Snowflake } from "@kontestis/models";
import { useMutation } from "react-query";

import { http, MutationHandler, wrapAxios } from "../../../api/http";

type CreateQuestionVariables = {
    question: string;
};

export const useCreateQuestion: MutationHandler<CreateQuestionVariables, undefined, Snowflake> = (
    contestId,
    options
) =>
    useMutation(
        (variables) => wrapAxios(http.post("/contest/question/" + contestId, variables)),
        options
    );
