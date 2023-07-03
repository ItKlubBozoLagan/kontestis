import { Snowflake } from "@kontestis/models";
import { useMutation } from "react-query";

import { http, MutationHandler, wrapAxios } from "../../api/http";

export type CodeRotateResult = {
    code: string;
};

export const useRotateContestCode: MutationHandler<void, CodeRotateResult, Snowflake> = (
    contestId,
    options
) => useMutation(() => wrapAxios(http.patch(`/contest/${contestId}/join`)), options);
