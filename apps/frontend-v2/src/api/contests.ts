import { ContestWithPermissions } from "@kontestis/models";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { http, HttpError, wrapAxios } from "./http";

export function useAllContests() {
    return useQuery<ContestWithPermissions[], HttpError>({
        queryKey: ["contests"],
        queryFn: () => wrapAxios(http.get("/contest")),
    });
}

export function useContest(contestId: bigint) {
    return useQuery<ContestWithPermissions, HttpError>({
        queryKey: ["contests", contestId.toString()],
        queryFn: () => wrapAxios(http.get(`/contest/${contestId}`)),
        enabled: contestId !== 0n,
    });
}

export function useRegisterContest(contestId: bigint) {
    const queryClient = useQueryClient();

    return useMutation<void, HttpError, void>({
        mutationFn: () => wrapAxios(http.post(`/contest/${contestId}/members/register/`)),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["contests"] });
            queryClient.invalidateQueries({ queryKey: ["contests", contestId.toString()] });
        },
    });
}

interface JoinContestResult {
    contest_id: bigint;
    organisation_id: bigint;
}

export function useJoinContestByCode() {
    const queryClient = useQueryClient();

    return useMutation<JoinContestResult, HttpError, { code: string }>({
        mutationFn: ({ code }) => wrapAxios(http.post("/contest/join", { join_code: code })),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["contests"] });
        },
    });
}
