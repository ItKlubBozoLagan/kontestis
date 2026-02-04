import { ContestAnnouncement, ContestMember, ContestQuestion } from "@kontestis/models";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { http, HttpError, wrapAxios } from "./http";

export function useAllContestAnnouncements(contestId: bigint) {
    return useQuery<ContestAnnouncement[], HttpError>({
        queryKey: ["contests", contestId.toString(), "announcements"],
        queryFn: () => wrapAxios(http.get(`/contest/${contestId}/announcement`)),
        enabled: contestId !== 0n,
    });
}

export function useAllContestQuestions(contestId: bigint) {
    return useQuery<ContestQuestion[], HttpError>({
        queryKey: ["contests", contestId.toString(), "questions"],
        queryFn: () => wrapAxios(http.get(`/contest/${contestId}/question`)),
        enabled: contestId !== 0n,
    });
}

export function useSelfContestMembers() {
    return useQuery<ContestMember[], HttpError>({
        queryKey: ["contests", "members", "self"],
        queryFn: () => wrapAxios(http.get("/contest/members/self")),
    });
}

interface CreateQuestionInput {
    question: string;
}

export function useCreateQuestion(contestId: bigint) {
    const queryClient = useQueryClient();

    return useMutation<ContestQuestion, HttpError, CreateQuestionInput>({
        mutationFn: (data) => wrapAxios(http.post(`/contest/${contestId}/question`, data)),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["contests", contestId.toString(), "questions"],
            });
        },
    });
}
