import { generateSunflake } from "sunflake";

export type Snowflake = bigint;

export const generateSnowflake: () => Snowflake = (() => {
    const sunflake = generateSunflake({
        machineId: process.env.MACHINE_ID ?? 1,
        as: "bigint"
    });
    return () => sunflake();
})();