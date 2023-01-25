import { useQuery } from "react-query";

import { http, QueryHandler, wrapAxios } from "../../api/http";
import { ContestType } from "../../types/ContestType";
import { Snowflake } from "../../types/Snowflake";

export const useContest: QueryHandler<ContestType, [Snowflake]> = (contestId) =>
    useQuery(["contest", contestId], () =>
        wrapAxios(http.get(`/contest/${contestId}`))
    );
