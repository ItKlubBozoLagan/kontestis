import { SystemMetrics } from "@kontestis/models";
import { useQuery } from "react-query";

import { http, QueryHandler, wrapAxios } from "../../../api/http";

export const useSystemMetrics: QueryHandler<SystemMetrics> = (options) =>
    useQuery({
        queryKey: ["stats", "metrics"],
        queryFn: () => wrapAxios(http.get("/stats/admin/metrics")),
        ...options,
    });
