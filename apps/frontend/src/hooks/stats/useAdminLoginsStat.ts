import { useQuery } from "react-query";

import { http, QueryHandler, wrapAxios } from "../../api/http";
import { CountStat, CountStatRange } from "./types";

type Parameter = {
    range: CountStatRange;
    unique: boolean;
};

export const useAdminLoginsStat: QueryHandler<CountStat[], Parameter> = (
    { range, unique },
    options
) =>
    useQuery({
        queryKey: ["stats", "admin", "logins", range, String(unique)],
        queryFn: () => wrapAxios(http.get(`/stats/admin/logins?range=${range}&unique=${unique}`)),
        ...options,
    });
