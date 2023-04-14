import { Snowflake } from "@kontestis/models";
import { useMutation } from "react-query";

import { http, invalidateOnSuccess, MutationHandler, wrapAxios } from "../../../api/http";

export const useRemoveParticipant: MutationHandler<Snowflake, undefined, Snowflake> = (
    contestId,
    options
) =>
    useMutation(
        (userId) => wrapAxios(http.delete(`/contest/${contestId}/members/${userId}`)),
        invalidateOnSuccess([["contests", contestId, "members"]], options)
    );
