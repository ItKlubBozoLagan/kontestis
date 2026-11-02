process.env.JWT_SECRET ??= "test-only-secret";

module.exports = {
    preset: "ts-jest",
    testEnvironment: "node",
    testMatch: ["**/*.spec.ts"],
    modulePathIgnorePatterns: ["<rootDir>/node_modules"],
    globalSetup: "<rootDir>/jest.globalSetup.mjs",
    globalTeardown: "<rootDir>/jest.globalTeardown.mjs",
};
