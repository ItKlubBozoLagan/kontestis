import { ContestQuestion, Snowflake } from "@kontestis/models";
import { useQuery } from "react-query";

import { http, QueryHandler, wrapAxios } from "../../../api/http";

export const useAllContestQuestions: QueryHandler<ContestQuestion[], Snowflake> = (
    contest_id,
    ...options
) =>
    useQuery({
        queryKey: ["contests", contest_id, "questions"],
        queryFn: () => wrapAxios(http.get("/contest/question/" + contest_id)),
        ...options,
    });
