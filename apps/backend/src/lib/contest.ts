import { Contest, Snowflake } from "@kontestis/models";

import { pushNotificationsToMany } from "./notifications";

type ContestLike = Pick<Contest, "start_time" | "duration_seconds">;

export const isContestRunning = (contest: ContestLike, currentTime = Date.now()) =>
    currentTime >= contest.start_time.getTime() &&
    currentTime <= contest.start_time.getTime() + contest.duration_seconds * 1000;

export const pushContestNotifications = (
    contest: Pick<Contest, "name" | "start_time" | "duration_seconds">,
    userIds: Snowflake[]
) =>
    Promise.all([
        pushNotificationsToMany(
            {
                type: "contest-start",
                data: contest.name,
                created_at: contest.start_time,
            },
            userIds
        ),
        pushNotificationsToMany(
            {
                type: "contest-end",
                data: contest.name,
                created_at: new Date(
                    contest.start_time.getTime() + contest.duration_seconds * 1000
                ),
            },
            userIds
        ),
    ]);
