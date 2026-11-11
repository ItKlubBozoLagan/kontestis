import type { Contest, ExamFinalSubmissionWithProblemId } from "@kontestis/models";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import { useCurrentUser } from "@/api/auth";
import { submissionQueries } from "@/api/submissions";

/**
 * The viewer's own final submissions in an exam, keyed by problem id. In an exam only the final
 * submission of each task is graded, so "which tasks have one" is the participant's progress.
 * Disabled (empty) for normal contests.
 */
export const useExamFinals = (contest: Pick<Contest, "id" | "exam">, enabled = true) => {
    const user = useCurrentUser();
    const query = useQuery({
        ...submissionQueries.finalForUser(contest.id, user.id),
        enabled: contest.exam && enabled,
    });

    const byProblem = useMemo(() => {
        const map = new Map<string, ExamFinalSubmissionWithProblemId>();

        for (const final of query.data ?? []) map.set(final.problem_id.toString(), final);

        return map;
    }, [query.data]);

    return { ...query, byProblem };
};

export const examChip = {
    chosen: "border-sky-400 bg-sky-50 text-sky-900 dark:border-sky-700 dark:bg-sky-950/70 dark:text-sky-100",
    missing: "border-border bg-card text-foreground",
};
