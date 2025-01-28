import { Snowflake } from "@kontestis/models";
import { useMutation } from "react-query";

import { http, invalidateOnSuccess, MutationHandler, wrapAxios } from "../../../api/http";

export const useAddParticipant: MutationHandler<string, undefined, Snowflake> = (
    contestId,
    options
) =>
    useMutation(
        (email) =>
            wrapAxios(
                http.post(`/contest/${contestId}/members/register`, {
                    email,
                })
            ),
        invalidateOnSuccess([["contests", contestId, "members"]], options)
    );
