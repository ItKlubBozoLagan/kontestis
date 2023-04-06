import { Snowflake } from "./Snowflake";

export type TestcaseV1 = {
    id: Snowflake;
    cluster_id: Snowflake;
    input: string;
    correctoutput?: string;
};

export type TestcaseV2 = Omit<TestcaseV1, "correctoutput"> & {
    correct_output?: string;
};

export type TestcaseV3 = Omit<TestcaseV2, "correct_output">;

export type Testcase = TestcaseV3;

export type TestcaseWithOutput = Testcase & {
    correct_output: string;
};
