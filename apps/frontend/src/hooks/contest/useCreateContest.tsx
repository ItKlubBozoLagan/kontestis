import { Contest, Snowflake } from "@kontestis/models";
import { useMutation } from "react-query";

import { http, invalidateOnSuccess, MutationHandler, wrapAxios } from "../../api/http";

export type ContestVariables = {
    name: string;
    start_time_millis: number;
    duration_seconds: number;
    show_leaderboard: boolean;
    public: boolean;
    official: boolean;
    exam: boolean;
};

export const useCreateContest: MutationHandler<ContestVariables, Contest> = (options) =>
    useMutation(
        (variables) => wrapAxios(http.post("/contest", variables)),
        invalidateOnSuccess([["contests"]], options)
    );

export const useModifyContest: MutationHandler<ContestVariables, Contest, Snowflake> = (
    contestId,
    options
) =>
    useMutation(
        (variables) => wrapAxios(http.patch(`/contest/${contestId}`, variables)),
        invalidateOnSuccess([["contests"]], options)
    );
