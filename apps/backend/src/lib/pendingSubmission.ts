import { PendingSubmission, Snowflake } from "@kontestis/models";
import { mapFields } from "@kontestis/utils";

import { Redis } from "../redis/Redis";
import { RedisKeys } from "../redis/RedisKeys";

type PendingSubmissionMeta = {
    problemId: Snowflake;
    userId: Snowflake;
};

const convertToPlainRedis = (submission: PendingSubmission) =>
    mapFields(mapFields(submission, ["id", "user_id"], String), ["created_at"], (date) =>
        date.toISOString()
    );

type PlainPendingSubmission = ReturnType<typeof convertToPlainRedis>;

const convertToTyped = (raw: PlainPendingSubmission): PendingSubmission =>
    mapFields(mapFields(raw, ["id", "user_id"], BigInt), ["created_at"], (date) => new Date(date));

export const storePendingSubmission = async (
    meta: PendingSubmissionMeta,
    submission: PendingSubmission
) => {
    await Redis.hSet(
        RedisKeys.PENDING_SUBMISSION(meta.userId, meta.problemId, submission.id),
        convertToPlainRedis(submission)
    ).then(() => {
        Redis.expire(RedisKeys.PENDING_SUBMISSION(meta.userId, meta.problemId, submission.id), 60);
    });
};

export const completePendingSubmission = async (
    meta: PendingSubmissionMeta,
    pendingSubmissionId: Snowflake
) => {
    await Redis.del(RedisKeys.PENDING_SUBMISSION(meta.userId, meta.problemId, pendingSubmissionId));
};

export const getAllPendingSubmissions = async (meta: PendingSubmissionMeta) => {
    const keys = await Redis.keys(RedisKeys.PENDING_SUBMISSION_KEYS(meta.userId, meta.problemId));

    return Promise.all(
        keys.map(async (key) =>
            convertToTyped((await Redis.hGetAll(key)) as PlainPendingSubmission)
        )
    );
};
