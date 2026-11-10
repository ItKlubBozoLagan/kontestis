import type { ExamFinalSubmissionWithProblemId } from "@kontestis/models";
import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";

import { api } from "@/api/http";

type Id = bigint | string;

export const managementQueries = {
    /** Final submissions of every participant of an exam (contest staff only). */
    contestFinalSubmissions: (contestId: Id) =>
        queryOptions({
            // under "final-submissions" so final submission mutations invalidate it
            queryKey: ["final-submissions", "contest", contestId.toString()],
            queryFn: () =>
                api.get<ExamFinalSubmissionWithProblemId[]>(
                    `/submission/final/contest/${contestId}`
                ),
        }),
};

/** Adds another user to a contest by email; renders its own error message. */
export const useAddContestParticipant = (contestId: Id) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (email: string) =>
            api.post(`/contest/${contestId}/members/register`, { email }),
        onSuccess: () =>
            queryClient.invalidateQueries({ queryKey: ["contests", contestId.toString()] }),
        meta: { silent: true },
    });
};
