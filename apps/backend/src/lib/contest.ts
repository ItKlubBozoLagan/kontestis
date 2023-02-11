import { Contest } from "@kontestis/models";

type ContestLike = Pick<Contest, "start_time" | "duration_seconds">;

export const isContestRunning = (contest: ContestLike) =>
    Date.now() >= contest.start_time.getTime() &&
    Date.now() <= contest.start_time.getTime() + contest.duration_seconds * 1000;
