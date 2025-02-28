import { Snowflake } from "@kontestis/models";

import { Globals } from "../globals";

export const RedisKeys = {
    // might be best to replace this with some set approach later on
    PENDING_SUBMISSION_KEYS: (userId: Snowflake, problemId: Snowflake) =>
        `${userId}:problems:${problemId}:submissions:*`,
    PENDING_SUBMISSION: (userId: Snowflake, problemId: Snowflake, submissionId: Snowflake) =>
        `${userId}:problems:${problemId}:submissions:${submissionId}`,
    REEVALUATION_IDS: (problemId: Snowflake) => `${problemId}:reevaluation`,
    CLUSTER_STATUS: (clusterId: Snowflake) => `cluster:${clusterId}:status`,
    CACHED_TESTCASE_INPUT: (clusterId: Snowflake, testcase: Snowflake) =>
        `cluster:${clusterId}:testcase:${testcase}:data-input`,
    CACHED_TESTCASE_OUTPUT: (clusterId: Snowflake, testcase: Snowflake) =>
        `cluster:${clusterId}:testcase:${testcase}:data-output`,
    TASK_ELO_PROCESSING: (contestId: Snowflake) => `tasks:elo:${contestId}`,
    MANAGED_USER_CONFIRMATION_CODE: (userId: Snowflake) => `user:confirmation:${userId}`,
    EVALUATION_RESULT_QUEUE: `${Globals.evaluatorRedisResponseQueuePrefix}:${Globals.INSTANCE_ID}`,
};
