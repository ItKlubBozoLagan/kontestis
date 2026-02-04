import {
    Cluster,
    ClusterSubmission,
    Submission,
    SubmissionByProblemResponse,
    TestcaseSubmission,
} from "@kontestis/models";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { http, HttpError, wrapAxios } from "./http";

export function useAllProblemSubmissions(problemId: bigint) {
    return useQuery<SubmissionByProblemResponse[], HttpError>({
        queryKey: ["submissions", "problem", problemId.toString()],
        queryFn: () => wrapAxios(http.get(`/submission/by-problem/${problemId}`)),
        enabled: problemId !== 0n,
        refetchInterval: (query) => {
            const { data } = query.state;
            const hasAnyIncomplete = (data ?? []).some((it) => !it.completed);

            return hasAnyIncomplete ? 1000 : false;
        },
    });
}

// Alias for backwards compatibility
export const useProblemSubmissions = useAllProblemSubmissions;

export function useAllSubmissions(userId: bigint) {
    return useQuery<Submission[], HttpError>({
        queryKey: ["submissions", "user", userId.toString()],
        queryFn: () => wrapAxios(http.get(`/submission/by-user/${userId}`)),
        enabled: userId !== 0n,
    });
}

export function useSubmission(submissionId: bigint) {
    return useQuery<Submission, HttpError>({
        queryKey: ["submissions", submissionId.toString()],
        queryFn: () => wrapAxios(http.get(`/submission/${submissionId}`)),
        enabled: submissionId !== 0n,
    });
}

export function useSubmissionClusters(submissionId: bigint) {
    return useQuery<ClusterSubmission[], HttpError>({
        queryKey: ["submissions", submissionId.toString(), "clusters"],
        queryFn: () => wrapAxios(http.get(`/submission/cluster/${submissionId}`)),
        enabled: submissionId !== 0n,
    });
}

export function useSubmissionTestcases(clusterSubmissionId: bigint) {
    return useQuery<TestcaseSubmission[], HttpError>({
        queryKey: ["submissions", "cluster", clusterSubmissionId.toString(), "testcases"],
        queryFn: () => wrapAxios(http.get(`/submission/testcase/${clusterSubmissionId}`)),
        enabled: clusterSubmissionId !== 0n,
    });
}

export function useAllClusters(problemId: bigint) {
    return useQuery<Cluster[], HttpError>({
        queryKey: ["problems", problemId.toString(), "clusters"],
        queryFn: () => wrapAxios(http.get(`/problem/${problemId}/cluster`)),
        enabled: problemId !== 0n,
    });
}

export function useSubmissionFiles(
    submissionId: bigint,
    clusterId: bigint,
    options?: { enabled?: boolean }
) {
    return useQuery<string[], HttpError>({
        queryKey: ["submissions", submissionId.toString(), "files", clusterId.toString()],
        queryFn: () => wrapAxios(http.get(`/submission/files/${submissionId}/${clusterId}`)),
        enabled: submissionId !== 0n && clusterId !== 0n && (options?.enabled ?? true),
    });
}

export async function getSubmissionFileUrl(
    submissionId: bigint,
    clusterId: bigint,
    testcaseId: bigint,
    type: "in" | "out" | "sout"
): Promise<string> {
    const { url } = await wrapAxios<{ url: string }>(
        http.get(`/submission/files/${submissionId}/${clusterId}/${testcaseId}/${type}`)
    );

    return url;
}

interface SubmitSubmissionInput {
    code: string;
    language: string;
}

export function useSubmitSubmission(problemId: bigint) {
    const queryClient = useQueryClient();

    return useMutation<{ submission: bigint }, HttpError, SubmitSubmissionInput>({
        mutationFn: ({ code, language }) =>
            wrapAxios(
                http.post(`/submission/${problemId}`, {
                    code,
                    language,
                })
            ),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["submissions", "problem", problemId.toString()],
            });
            queryClient.invalidateQueries({
                queryKey: ["problems", problemId.toString(), "score"],
            });
        },
    });
}

export interface ContestMemberWithInfo {
    id: bigint;
    user_id: bigint;
    full_name: string;
    contest_id: bigint;
    score: Record<string, number>;
}

export function useContestLeaderboard(contestId: bigint, options?: { enabled?: boolean }) {
    return useQuery<ContestMemberWithInfo[], HttpError>({
        queryKey: ["contests", contestId.toString(), "leaderboard"],
        queryFn: () => wrapAxios(http.get(`/contest/${contestId}/leaderboard`)),
        enabled: contestId !== 0n && (options?.enabled ?? true),
    });
}
