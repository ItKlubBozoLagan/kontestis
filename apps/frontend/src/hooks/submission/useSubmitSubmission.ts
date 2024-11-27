import { EvaluationLanguage, Snowflake } from "@kontestis/models";
import { useMutation } from "react-query";

import { http, invalidateOnSuccess, MutationHandler, wrapAxios } from "../../api/http";

type SubmissionVariables = {
    code: string;
    language: EvaluationLanguage;
};

export const useSubmitSubmission: MutationHandler<SubmissionVariables, undefined, Snowflake> = (
    problemId,
    options
) =>
    useMutation(
        (variables) => wrapAxios(http.post(`/submission/${problemId}`, variables)),
        invalidateOnSuccess([["submission", "problem", problemId]], options)
    );
