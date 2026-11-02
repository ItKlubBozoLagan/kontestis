import type {
    ClusterSubmissionDetails,
    EvaluationLanguage,
    ExamFinalSubmission,
    ExamFinalSubmissionWithProblemId,
    Submission,
    SubmissionByProblemResponse,
    SubmissionWithUserInfo,
} from "@kontestis/models";
import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";

import { api } from "@/api/http";

type Id = bigint | string;
const key = (id: Id) => id.toString();

export type ProblemSubmissionListItem = Omit<SubmissionWithUserInfo, "code" | "error"> & {
    reevaluation: boolean;
};

export const submissionQueries = {
    /**
     * Submissions of one user for a problem. Without `userId` it's the logged in user's own
     * submissions, including pending ones (`completed: false`) — polled while any is pending.
     */
    byProblem: (problemId: Id, userId?: Id) =>
        queryOptions({
            queryKey: ["submissions", "problem", key(problemId), userId ? key(userId) : "self"],
            queryFn: () =>
                api.get<SubmissionByProblemResponse[]>(
                    `/submission/by-problem/${problemId}`,
                    userId ? { user_id: key(userId) } : undefined
                ),
            refetchInterval: (query) =>
                query.state.data?.some((it) => !it.completed) ? 1500 : false,
        }),
    /** Every submission for a problem, with author names (contest staff or after the contest). */
    allForProblem: (problemId: Id) =>
        queryOptions({
            queryKey: ["submissions", "problem", key(problemId), "all"],
            queryFn: () =>
                api.get<ProblemSubmissionListItem[]>(`/submission/by-problem-all/${problemId}`),
        }),
    detail: (submissionId: Id) =>
        queryOptions({
            queryKey: ["submissions", key(submissionId)],
            queryFn: () => api.get<Submission>(`/submission/${submissionId}`),
        }),
    /** Cluster results with nested testcase results (single request). */
    details: (submissionId: Id) =>
        queryOptions({
            queryKey: ["submissions", key(submissionId), "details"],
            queryFn: () =>
                api.get<ClusterSubmissionDetails[]>(`/submission/${submissionId}/details`),
        }),
    /** Names of downloadable files (`<testcase>.in|out|sout`) for one cluster of a submission. */
    files: (submissionId: Id, clusterId: Id) =>
        queryOptions({
            queryKey: ["submissions", key(submissionId), "files", key(clusterId)],
            queryFn: () => api.get<string[]>(`/submission/files/${submissionId}/${clusterId}`),
        }),
    finalForUser: (contestId: Id, userId: Id) =>
        queryOptions({
            queryKey: ["final-submissions", key(contestId), key(userId)],
            queryFn: () =>
                api.get<ExamFinalSubmissionWithProblemId[]>("/submission/final/", {
                    contest_id: key(contestId),
                    user_id: key(userId),
                }),
        }),
    final: (finalSubmissionId: Id) =>
        queryOptions({
            queryKey: ["final-submissions", "detail", key(finalSubmissionId)],
            queryFn: () => api.get<ExamFinalSubmission>(`/submission/final/${finalSubmissionId}`),
        }),
};

export const getSubmissionFileUrl = (
    submissionId: Id,
    clusterId: Id,
    testcaseId: Id,
    type: "in" | "out" | "sout"
) =>
    api.get<{ url: string }>(
        `/submission/files/${submissionId}/${clusterId}/${testcaseId}/${type}`
    );

export const useSubmitSolution = (problemId: Id) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (body: { language: EvaluationLanguage; code: string }) =>
            api.post<{ submission: bigint }>(`/submission/${problemId}`, body),
        onSuccess: () =>
            queryClient.invalidateQueries({ queryKey: ["submissions", "problem", key(problemId)] }),
    });
};

export const useReevaluateSubmission = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (submissionId: Id) => api.post(`/submission/reevaluate/${submissionId}`),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["submissions"] }),
    });
};

export const useSetFinalSubmission = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (submissionId: Id) =>
            api.post<ExamFinalSubmission>(`/submission/final/${submissionId}`),
        onSuccess: () =>
            Promise.all([
                queryClient.invalidateQueries({ queryKey: ["final-submissions"] }),
                queryClient.invalidateQueries({ queryKey: ["contests"] }),
            ]),
    });
};

export const useReviewFinalSubmission = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            finalSubmissionId,
            ...body
        }: {
            finalSubmissionId: Id;
            final_score: number;
            reviewed: boolean;
        }) => api.patch(`/submission/final/${finalSubmissionId}`, body),
        onSuccess: () =>
            Promise.all([
                queryClient.invalidateQueries({ queryKey: ["final-submissions"] }),
                queryClient.invalidateQueries({ queryKey: ["contests"] }),
            ]),
    });
};
