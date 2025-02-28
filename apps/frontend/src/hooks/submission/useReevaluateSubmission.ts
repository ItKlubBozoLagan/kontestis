import { Snowflake } from "@kontestis/models";
import { useMutation } from "react-query";

import { http, invalidateOnSuccess, MutationHandler, wrapAxios } from "../../api/http";

export const useReevaluateSubmission: MutationHandler<
    undefined,
    undefined,
    [Snowflake, Snowflake]
> = ([submissionId, problemId], options) =>
    useMutation(
        () => wrapAxios(http.post(`/submission/reevaluate/${submissionId}`)),
        invalidateOnSuccess(
            [
                ["submission", submissionId],
                ["submission", "problem", problemId],
            ],
            options
        )
    );
