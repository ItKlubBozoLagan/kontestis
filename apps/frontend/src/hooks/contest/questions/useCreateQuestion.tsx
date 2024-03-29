import { ContestQuestion, Snowflake } from "@kontestis/models";
import { useMutation } from "react-query";

import { http, invalidateOnSuccess, MutationHandler, wrapAxios } from "../../../api/http";

type CreateQuestionVariables = {
    question: string;
};

export const useCreateQuestion: MutationHandler<
    CreateQuestionVariables,
    ContestQuestion,
    Snowflake
> = (contestId, options) =>
    useMutation(
        (variables) => wrapAxios(http.post(`/contest/${contestId}/question/`, variables)),
        invalidateOnSuccess([["contests", contestId, "questions"]], options)
    );
