import { Snowflake } from "../lib/snowflake";

export type TestcaseV1 = {
    id: Snowflake;
    cluster_id: Snowflake;
    input: string;
    correctoutput?: string;
};

export type Testcase = TestcaseV1;
