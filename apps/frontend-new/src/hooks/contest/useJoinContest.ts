import { Snowflake } from "@kontestis/models";
import { useMutation } from "react-query";

import { http, MutationHandler, wrapAxios } from "../../api/http";

type JoinContestVariables = {
    join_code: string;
};

type JoinContestResult = {
    contest_id: Snowflake;
    organisation_id: Snowflake;
};

export const useJoinContest: MutationHandler<JoinContestVariables, JoinContestResult> = (options) =>
    useMutation((variables) => wrapAxios(http.post("/contest/join", variables)), options);
