import { ContestQuestion, Snowflake } from "@kontestis/models";
import { useMutation } from "react-query";

import { http, MutationHandler, wrapAxios } from "../../../api/http";

type AnswerQuestionVariables = {
    response: string;
};

export const useAnswerQuestion: MutationHandler<
    AnswerQuestionVariables,
    ContestQuestion,
    Snowflake
> = (questionId, options) =>
    useMutation(
        (variables) => wrapAxios(http.patch("/contest/question/" + questionId, variables)),
        options
    );
