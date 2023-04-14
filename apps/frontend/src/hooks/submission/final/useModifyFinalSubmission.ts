import { Snowflake } from "@kontestis/models";
import { useMutation } from "react-query";

import { http, invalidateOnSuccess, MutationHandler, wrapAxios } from "../../../api/http";

type FinalSubmissionVariables = {
    final_score: number;
    reviewed: boolean;
};

export const useModifyFinalSubmission: MutationHandler<
    FinalSubmissionVariables,
    undefined,
    Snowflake
> = (finalSubmissionId, options) =>
    useMutation(
        (variables) => wrapAxios(http.patch(`/submission/final/${finalSubmissionId}`, variables)),
        invalidateOnSuccess(
            [["submission", "final", "submission", finalSubmissionId.toString()]],
            options
        )
    );
