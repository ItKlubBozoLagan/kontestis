import { Snowflake } from "@kontestis/models";
import { Submission } from "@kontestis/models";
import { useQuery } from "react-query";

import { http, QueryHandler, wrapAxios } from "../../api/http";

export const useAllSubmissions: QueryHandler<Submission[], Snowflake | undefined> = (
    userId,
    options
) =>
    useQuery({
        queryKey: ["submission"],
        queryFn: () =>
            wrapAxios(
                http.get("/submission", userId ? { params: { user_id: userId } } : undefined)
            ),
        ...options,
    });
