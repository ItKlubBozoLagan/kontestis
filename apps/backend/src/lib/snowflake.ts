import { Snowflake } from "@kontestis/models";
import { decode, generateSunflake, SunflakeConfig } from "sunflake";

const sunflakeConfig: SunflakeConfig<"bigint"> = {
    machineId: process.env.MACHINE_ID ?? 1,
    as: "bigint",
};

export const generateSnowflake: () => Snowflake = (() => {
    const sunflake = generateSunflake(sunflakeConfig);

    return () => sunflake();
})();

export const getSnowflakeTime: (s: Snowflake) => Date = (snowflake: Snowflake) => {
    return new Date(Number(decode(snowflake, sunflakeConfig).time));
};
