import { Snowflake } from "@kontestis/models";
import { useMutation } from "react-query";

import { http, invalidateOnSuccess, MutationHandler, wrapAxios } from "../../api/http";

type BulkCreateVariables = {
    names: string[];
    contest_ids: string[];
    prefix: string;
};

type BulkCreateResult = Array<{
    name: string;
    username: string;
    password: string;
}>;

export const useBulkCreateTemporaryUsers: MutationHandler<
    BulkCreateVariables,
    BulkCreateResult,
    Snowflake
> = (contestId, options) =>
    useMutation(
        (variables) => wrapAxios(http.post("/auth/temporary/bulk-create", variables)),
        invalidateOnSuccess([["contests", contestId, "members"]], options)
    );
