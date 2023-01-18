import { generateSunflake } from "sunflake";

export type Snowflake = string;

export const generateSnowflake: () => Snowflake = (() => {
    const sunflake = generateSunflake({
        machineId: process.env.MACHINE_ID ?? 1,
        as: "string",
    });

    return () => sunflake();
})();
