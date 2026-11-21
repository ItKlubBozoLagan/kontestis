import { useQueries } from "@tanstack/react-query";

import type { VisibleProblem } from "@/api/problems";
import { type ProblemSubmissionListItem, submissionQueries } from "@/api/submissions";

export const FEED_SIZE = 30;
const LIVE_INTERVAL = 15_000;

export type FeedSubmission = ProblemSubmissionListItem & { problem: VisibleProblem };

/**
 * Every submission of a contest, merged from the per-problem staff lists (there is no
 * contest-wide endpoint). Polled while `live`.
 */
export const useContestSubmissions = (problems: VisibleProblem[], live: boolean) =>
    useQueries({
        queries: problems.map((problem) => ({
            ...submissionQueries.allForProblem(problem.id),
            refetchInterval: live ? LIVE_INTERVAL : (false as const),
        })),
        combine: (results) => {
            const all: FeedSubmission[] = results.flatMap((result, index) =>
                (result.data ?? []).map((submission) => ({
                    ...submission,
                    problem: problems[index],
                }))
            );

            // snowflakes grow with creation time
            all.sort((a, b) => (a.id === b.id ? 0 : a.id > b.id ? -1 : 1));

            return {
                recent: all.slice(0, FEED_SIZE),
                total: all.length,
                isPending: results.some((result) => result.isPending),
            };
        },
    });
