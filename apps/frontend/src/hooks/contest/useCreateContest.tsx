import { Contest } from "@kontestis/models";
import { useMutation } from "react-query";

import { http, MutationHandler, wrapAxios } from "../../api/http";

type CreateContestVariables = {
    name: string;
    start_time_millis: number;
    duration_seconds: number;
    public: boolean;
    official: boolean;
};

export const useCreateContest: MutationHandler<CreateContestVariables, Contest> = (options) =>
    useMutation((variables) => wrapAxios(http.post("/contest", variables)), options);
