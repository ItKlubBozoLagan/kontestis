import { Snowflake } from "@kontestis/models";
import { useMutation } from "react-query";

import { http, invalidateOnSuccess, MutationHandler, wrapAxios } from "../../api/http";

export const useSetFinalSubmission: MutationHandler<
    Snowflake,
    undefined,
    [Snowflake, Snowflake]
> = ([contestId, userId], options) =>
    useMutation(
        (submissionId) => wrapAxios(http.post(`/submission/final/${submissionId}`)),
        invalidateOnSuccess([["submission", "final", contestId, userId]], options)
    );
