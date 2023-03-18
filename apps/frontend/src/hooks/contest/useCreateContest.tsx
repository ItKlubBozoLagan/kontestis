import { Contest, Snowflake } from "@kontestis/models";
import { useMutation } from "react-query";

import { http, MutationHandler, wrapAxios } from "../../api/http";

export type ContestVariables = {
    name: string;
    start_time_millis: number;
    duration_seconds: number;
    public: boolean;
    official: boolean;
};

export const useCreateContest: MutationHandler<ContestVariables, Contest> = (options) =>
    useMutation((variables) => wrapAxios(http.post("/contest", variables)), options);

export const useModifyContest: MutationHandler<ContestVariables, Contest, Snowflake> = (
    contestId,
    options
) => useMutation((variables) => wrapAxios(http.patch(`/contest/${contestId}`, variables)), options);
