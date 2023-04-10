import { Snowflake } from "@kontestis/models";
import { useMutation } from "react-query";

import { http, MutationHandler, wrapAxios } from "../../../api/http";

type ContestMemberVariables = {
    contest_permissions: bigint;
};

export const useModifyContestMember: MutationHandler<
    ContestMemberVariables,
    undefined,
    [Snowflake, Snowflake]
> = ([contestId, userId], options) =>
    useMutation(
        (variables) => wrapAxios(http.patch(`/contest/${contestId}/members/${userId}`, variables)),
        options
    );
