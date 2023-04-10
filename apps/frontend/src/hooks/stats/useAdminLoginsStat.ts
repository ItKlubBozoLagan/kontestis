import { useQuery } from "react-query";

import { http, QueryHandler, wrapAxios } from "../../api/http";
import { CountStatRange, CountStatWithPeriod } from "./types";

export type AdminLoginStatParamaters = {
    range: CountStatRange;
    unique: boolean;
    newLogins: boolean;
};

export const useAdminLoginsStat: QueryHandler<CountStatWithPeriod, AdminLoginStatParamaters> = (
    { range, unique, newLogins },
    options
) =>
    useQuery({
        queryKey: ["stats", "admin", "logins", range, String(unique), String(newLogins)],
        queryFn: () =>
            wrapAxios(
                http.get(
                    `/stats/admin/logins?range=${range}&unique=${unique}&newLogins=${newLogins}`
                )
            ),
        ...options,
    });
