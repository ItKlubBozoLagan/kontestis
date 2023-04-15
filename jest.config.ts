import type { Config } from "@jest/type";

const config: Config.InitialOptions = {
    transform: {
        ".ts": "ts-jest",
    },
    testMatch: ["<rootDir>/**/*.spec.[jt]s"],
}

export default config;
