import type { DashboardOverview, SystemMetrics } from "@kontestis/models";
import { queryOptions } from "@tanstack/react-query";

import { api } from "@/api/http";

export type StatisticRange = "24h" | "7d" | "30d" | "1y";
export type CountStatistic = { time: Date; count: number };
export type LastStatistic = { time: Date; last: number };
export type CountStatisticWithPeriod = { stats: CountStatistic[]; previousPeriodChange: number };

export const statsQueries = {
    overview: () =>
        queryOptions({
            queryKey: ["stats", "overview"],
            queryFn: () => api.get<DashboardOverview>("/stats/overview"),
        }),
    elo: (range: StatisticRange) =>
        queryOptions({
            queryKey: ["stats", "elo", range],
            queryFn: () => api.get<LastStatistic[]>("/stats/elo", { range }),
        }),
    /** Daily submission counts for the last year (activity calendar). */
    submissions: (acceptedOnly: boolean) =>
        queryOptions({
            queryKey: ["stats", "submissions", acceptedOnly],
            queryFn: () =>
                api.get<CountStatistic[]>("/stats/submissions", { accepted: String(acceptedOnly) }),
        }),
    adminLogins: (range: StatisticRange, unique: boolean, newLogins: boolean) =>
        queryOptions({
            queryKey: ["stats", "admin", "logins", range, unique, newLogins],
            queryFn: () =>
                api.get<CountStatisticWithPeriod>("/stats/admin/logins", {
                    range,
                    unique: String(unique),
                    newLogins: String(newLogins),
                }),
        }),
    adminActivity: (range: StatisticRange) =>
        queryOptions({
            queryKey: ["stats", "admin", "activity", range],
            queryFn: () => api.get<CountStatisticWithPeriod>("/stats/admin/activity", { range }),
        }),
    systemMetrics: () =>
        queryOptions({
            queryKey: ["stats", "admin", "metrics"],
            queryFn: () => api.get<SystemMetrics & { unix_time: number }>("/stats/admin/metrics"),
            refetchInterval: 5000,
        }),
};
