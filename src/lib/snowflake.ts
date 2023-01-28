import { decode, generateSunflake, SunflakeConfig } from "sunflake";

export type Snowflake = bigint;

const sunFlakeConfig: SunflakeConfig<"bigint"> = {
    machineId: process.env.MACHINE_ID ?? 1,
    as: "bigint",
};

export const generateSnowflake: () => Snowflake = (() => {
    const sunflake = generateSunflake(sunFlakeConfig);

    return () => sunflake();
})();

export const getSnowflakeTime: (s: Snowflake) => Date = (
    snowflake: Snowflake
) => {
    return new Date(Number(decode(snowflake, sunFlakeConfig).time));
};
