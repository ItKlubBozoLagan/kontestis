import { ContestQuestion, Snowflake } from "@kontestis/models";
import { useMutation } from "react-query";

import { http, MutationHandler, wrapAxios } from "../../../api/http";

type AnswerQuestionVariables = {
    response: string;
};

export const useAnswerQuestion: MutationHandler<
    AnswerQuestionVariables,
    ContestQuestion,
    [Snowflake, Snowflake]
> = ([contestId, questionId], options) =>
    useMutation(
        (variables) =>
            wrapAxios(http.patch(`/contest/${contestId}/question/${questionId}`, variables)),
        options
    );
