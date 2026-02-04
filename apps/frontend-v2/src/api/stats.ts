import { useQuery } from "@tanstack/react-query";

import { http, HttpError, wrapAxios } from "./http";

export interface SubmissionStat {
    time: Date;
    last: number;
}

export function useSubmissionStats(accepted: boolean = false) {
    return useQuery<SubmissionStat[], HttpError>({
        queryKey: ["stats", "submissions", String(accepted)],
        queryFn: () => wrapAxios(http.get(`/stats/submissions?accepted=${accepted}`)),
    });
}
