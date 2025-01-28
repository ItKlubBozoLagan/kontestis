import { Contest, Snowflake } from "@kontestis/models";
import { useMutation } from "react-query";

import { http, invalidateOnSuccess, MutationHandler, wrapAxios } from "../../api/http";

type CopyVariables = {
    organisation_id: Snowflake;
};

export const useCopyContest: MutationHandler<CopyVariables, Contest, Snowflake> = (
    contestId,
    options
) =>
    useMutation(
        (variables) => wrapAxios(http.post(`/contest/${contestId}/copy`, variables)),
        invalidateOnSuccess([["contests"]], options)
    );
