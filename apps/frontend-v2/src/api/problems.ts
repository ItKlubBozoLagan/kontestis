import { ProblemWithScore } from "@kontestis/models";
import { useQuery } from "@tanstack/react-query";

import { http, HttpError, wrapAxios } from "./http";

export function useAllProblems(contestId?: bigint) {
    return useQuery<ProblemWithScore[], HttpError>({
        queryKey: ["problems", contestId?.toString()],
        queryFn: () => wrapAxios(http.get("/problem", { params: { contest_id: contestId } })),
        enabled: !!contestId,
    });
}

export function useProblem(problemId: bigint) {
    return useQuery<ProblemWithScore, HttpError>({
        queryKey: ["problems", "single", problemId.toString()],
        queryFn: () => wrapAxios(http.get(`/problem/${problemId}`)),
        enabled: problemId !== 0n,
    });
}

export function useAllProblemScores() {
    return useQuery<Record<string, number>, HttpError>({
        queryKey: ["problems", "scores"],
        queryFn: () => wrapAxios(http.get("/problem/scores")),
    });
}

// Alias for consistency
export function useAllContestProblems() {
    return useQuery<ProblemWithScore[], HttpError>({
        queryKey: ["problems", "all"],
        queryFn: () => wrapAxios(http.get("/problem")),
    });
}

export function useProblemScore(problemId: bigint) {
    const scoresQuery = useAllProblemScores();
    const score = scoresQuery.data?.[problemId.toString()] ?? 0;

    return {
        ...scoresQuery,
        data: score,
    };
}
