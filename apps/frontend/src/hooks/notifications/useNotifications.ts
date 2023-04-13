import { SiteNotification } from "@kontestis/models";
import { useQuery } from "react-query";

import { http, QueryHandler, wrapAxios } from "../../api/http";

export const useNotifications: QueryHandler<SiteNotification[]> = (options) =>
    useQuery({
        queryKey: ["notifications"],
        queryFn: () => wrapAxios(http.get("/notifications")),
        ...options,
    });
