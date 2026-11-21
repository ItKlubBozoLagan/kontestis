const SNOWFLAKE_EPOCH = 1_640_995_200_000n;

/**
 * Creation time encoded in a Kontestis snowflake (sunflake: 42 bits of ms since 2022-01-01).
 * Submissions only persist a `date` without time, so the id is the precise timestamp.
 */
export const snowflakeTime = (id: bigint) =>
    new Date(Number((BigInt(id) >> 22n) + SNOWFLAKE_EPOCH));
