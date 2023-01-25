import { useQuery } from "react-query";

import { http, QueryHandler, wrapAxios } from "../../api/http";
import { Snowflake } from "../../types/Snowflake";
import { SubmissionType } from "../../types/SubmissionType";

export const useAllSubmissions: QueryHandler<
    SubmissionType[],
    [Snowflake | undefined]
> = (userId) =>
    useQuery(["submission"], () =>
        wrapAxios(
            http.get(
                "/submission",
                userId ? { params: { user_id: userId } } : undefined
            )
        )
    );
