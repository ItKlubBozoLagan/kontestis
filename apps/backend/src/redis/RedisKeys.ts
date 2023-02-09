import { Snowflake } from "@kontestis/models";

export const RedisKeys = {
    // might be best to replace this with some set approach later on
    PENDING_SUBMISSION_KEYS: (userId: Snowflake, problemId: Snowflake) =>
        `${userId}:problems:${problemId}:submissions:*`,
    PENDING_SUBMISSION: (userId: Snowflake, problemId: Snowflake, submissionId: Snowflake) =>
        `${userId}:problems:${problemId}:submissions:${submissionId}`,
};
