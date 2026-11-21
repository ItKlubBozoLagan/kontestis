import type {
    AdminContestListItem,
    Contest,
    ContestAnnouncement,
    ContestChatMessageWithAuthor,
    ContestMember,
    ContestMemberWithInfo,
    ContestQuestion,
    ContestWithPermissions,
    ExamGradingScale,
} from "@kontestis/models";
import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";

import { api, http } from "@/api/http";

type Id = bigint | string;
const key = (id: Id) => id.toString();

export const contestQueries = {
    /** Contests of the selected organisation, annotated with the requester's membership. */
    all: () =>
        queryOptions({
            queryKey: ["contests"],
            queryFn: () => api.get<ContestWithPermissions[]>("/contest"),
        }),
    /** Every contest in every organisation (site admins only). */
    adminAll: () =>
        queryOptions({
            queryKey: ["contests", "admin-all"],
            queryFn: () => api.get<AdminContestListItem[]>("/contest/all"),
        }),
    detail: (contestId: Id) =>
        queryOptions({
            queryKey: ["contests", key(contestId)],
            queryFn: () => api.get<Contest>(`/contest/${contestId}`),
        }),
    leaderboard: (contestId: Id, showAllUsers = false) =>
        queryOptions({
            queryKey: ["contests", key(contestId), "leaderboard", { showAllUsers }],
            queryFn: () =>
                api.get<ContestMemberWithInfo[]>(`/contest/${contestId}/leaderboard`, {
                    show_all_users: String(showAllUsers),
                }),
        }),
    member: (contestId: Id, userId: Id) =>
        queryOptions({
            queryKey: ["contests", key(contestId), "members", key(userId)],
            queryFn: () => api.get<ContestMember>(`/contest/${contestId}/members/${userId}`),
        }),
    selfMemberships: () =>
        queryOptions({
            queryKey: ["contests", "memberships", "self"],
            queryFn: () => api.get<ContestMember[]>("/contest/members/self"),
        }),
    announcements: (contestId: Id) =>
        queryOptions({
            queryKey: ["contests", key(contestId), "announcements"],
            queryFn: () => api.get<ContestAnnouncement[]>(`/contest/${contestId}/announcement`),
            refetchInterval: 60_000,
        }),
    questions: (contestId: Id) =>
        queryOptions({
            queryKey: ["contests", key(contestId), "questions"],
            queryFn: () => api.get<ContestQuestion[]>(`/contest/${contestId}/question`),
            refetchInterval: 30_000,
        }),
    threadMessages: (contestId: Id, threadId: Id) =>
        queryOptions({
            queryKey: ["contests", key(contestId), "questions", key(threadId), "messages"],
            queryFn: () =>
                api.get<ContestChatMessageWithAuthor[]>(
                    `/contest/${contestId}/question/${threadId}/messages`
                ),
            refetchInterval: 10_000,
        }),
    gradingScales: (contestId: Id) =>
        queryOptions({
            queryKey: ["contests", key(contestId), "grading"],
            queryFn: () => api.get<ExamGradingScale[]>(`/contest/${contestId}/grade`),
        }),
};

export type ContestFormValues = {
    name: string;
    start_time_millis: number;
    duration_seconds: number;
    public: boolean;
    official: boolean;
    exam: boolean;
    show_leaderboard: boolean;
    past_contest?: boolean;
};

const useInvalidate = () => {
    const queryClient = useQueryClient();

    return (...keys: unknown[][]) =>
        Promise.all(keys.map((queryKey) => queryClient.invalidateQueries({ queryKey })));
};

export const useCreateContest = () => {
    const invalidate = useInvalidate();

    return useMutation({
        mutationFn: (body: ContestFormValues) => api.post<Contest>("/contest", body),
        onSuccess: () => invalidate(["contests"], ["notifications"]),
    });
};

export const useUpdateContest = (contestId: Id) => {
    const invalidate = useInvalidate();

    return useMutation({
        mutationFn: (body: ContestFormValues) => api.patch(`/contest/${contestId}`, body),
        onSuccess: () => invalidate(["contests"]),
    });
};

export const useCopyContest = (contestId: Id) => {
    const invalidate = useInvalidate();

    return useMutation({
        mutationFn: (organisationId: Id) =>
            api.post<Contest>(`/contest/${contestId}/copy`, {
                organisation_id: organisationId.toString(),
            }),
        onSuccess: () => invalidate(["contests"]),
    });
};

export const useRotateJoinCode = (contestId: Id) => {
    const invalidate = useInvalidate();

    return useMutation({
        mutationFn: () => api.patch<{ code: string }>(`/contest/${contestId}/join`),
        onSuccess: () => invalidate(["contests", key(contestId)]),
    });
};

export const useJoinContest = () => {
    const invalidate = useInvalidate();

    return useMutation({
        mutationFn: (joinCode: string) =>
            api.post<{ contest_id: bigint; organisation_id: bigint }>("/contest/join", {
                join_code: joinCode,
            }),
        onSuccess: () => invalidate(["contests"], ["organisations"]),
        meta: { silent: true },
    });
};

/** Registers the logged in user, or — with an email — adds another user as a participant. */
export const useRegisterForContest = (contestId: Id) => {
    const invalidate = useInvalidate();

    return useMutation({
        mutationFn: (email?: string) =>
            api.post(`/contest/${contestId}/members/register`, email ? { email } : {}),
        onSuccess: () => invalidate(["contests"], ["notifications"]),
    });
};

export const useUpdateContestMember = (contestId: Id) => {
    const invalidate = useInvalidate();

    return useMutation({
        mutationFn: ({ userId, permissions }: { userId: Id; permissions: bigint }) =>
            api.patch(`/contest/${contestId}/members/${userId}`, {
                contest_permissions: permissions.toString(),
            }),
        onSuccess: () => invalidate(["contests", key(contestId)]),
    });
};

export const useRemoveContestMember = (contestId: Id) => {
    const invalidate = useInvalidate();

    return useMutation({
        mutationFn: (userId: Id) => api.delete(`/contest/${contestId}/members/${userId}`),
        onSuccess: () => invalidate(["contests", key(contestId)]),
    });
};

export const useCreateAnnouncement = (contestId: Id) => {
    const invalidate = useInvalidate();

    return useMutation({
        mutationFn: (message: string) =>
            api.post<ContestAnnouncement>(`/contest/${contestId}/announcement`, { message }),
        onSuccess: () => invalidate(["contests", key(contestId), "announcements"]),
    });
};

export const useCreateQuestion = (contestId: Id) => {
    const invalidate = useInvalidate();

    return useMutation({
        mutationFn: (question: string) =>
            api.post<ContestQuestion>(`/contest/${contestId}/question`, { question }),
        onSuccess: () => invalidate(["contests", key(contestId), "questions"]),
    });
};

export const useSendThreadMessage = (contestId: Id, threadId: Id) => {
    const invalidate = useInvalidate();

    return useMutation({
        mutationFn: (content: string) =>
            api.post(`/contest/${contestId}/question/${threadId}/messages`, { content }),
        onSuccess: () => invalidate(["contests", key(contestId), "questions"]),
    });
};

export const useCreateGradingScale = (contestId: Id) => {
    const invalidate = useInvalidate();

    return useMutation({
        mutationFn: (body: { percentage: number; grade: string }) =>
            api.post<ExamGradingScale>(`/contest/${contestId}/grade`, body),
        onSuccess: () => invalidate(["contests", key(contestId), "grading"]),
    });
};

export const useUpdateGradingScale = (contestId: Id) => {
    const invalidate = useInvalidate();

    return useMutation({
        mutationFn: ({ id, ...body }: { id: Id; percentage: number; grade: string }) =>
            api.patch(`/contest/${contestId}/grade/${id}`, body),
        onSuccess: () => invalidate(["contests", key(contestId), "grading"]),
    });
};

export const useDeleteGradingScale = (contestId: Id) => {
    const invalidate = useInvalidate();

    return useMutation({
        mutationFn: (id: Id) => api.delete(`/contest/${contestId}/grade/${id}`),
        onSuccess: () => invalidate(["contests", key(contestId), "grading"]),
    });
};

/** Downloads the .docx exam export of one participant. */
export const downloadContestExport = async (contestId: Id, userId: Id) => {
    const response = await http.get<Blob>(`/contest/${contestId}/export/${userId}`, {
        responseType: "blob",
    });
    const disposition = response.headers["content-disposition"] as string | undefined;
    const filename = /filename=([^;]+)/.exec(disposition ?? "")?.[1] ?? `export-${userId}.docx`;

    saveBlob(response.data, filename);
};

export const saveBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
};
