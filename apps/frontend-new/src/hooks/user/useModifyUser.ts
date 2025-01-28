import { Snowflake } from "@kontestis/models";
import { useMutation } from "react-query";

import { http, invalidateOnSuccess, MutationHandler, wrapAxios } from "../../api/http";

type UserVariables = {
    permissions: bigint;
};

export const useModifyUser: MutationHandler<UserVariables, undefined, Snowflake> = (
    userId,
    options
) =>
    useMutation(
        (variables) => wrapAxios(http.patch(`/auth/${userId}`, variables)),
        invalidateOnSuccess([["users"]], options)
    );
