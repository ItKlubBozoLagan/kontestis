import { useQuery } from "react-query";

import { http, QueryHandler, wrapAxios } from "../../api/http";
import { CountStatisticRange, CountStatisticWithPeriod } from "./types";

export type AdminLoginStatParamaters = {
    range: CountStatisticRange;
    unique: boolean;
    newLogins: boolean;
};

export const useAdminLoginsStat: QueryHandler<
    CountStatisticWithPeriod,
    AdminLoginStatParamaters
> = ({ range, unique, newLogins }, options) =>
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
