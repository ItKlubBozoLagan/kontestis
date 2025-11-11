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

export type GeneratorState =
    | "ready"
    | "pending"
    | "not-ready"
    | "generator-error"
    | "validation-error"
    | "solution-error";

export type TestcaseV4 = Omit<TestcaseV3, "input"> & {
    input_type: "manual" | "generator";
    output_type: "auto" | "manual" | "ai";
    status: GeneratorState;
    error?: string;
    generator_id?: Snowflake;
    generator_input?: string;
    input_file?: string;
    output_file?: string;
};

export type Testcase = TestcaseV4;

export type TestcaseWithData = Testcase & {
    input: string;
    correct_output: string;
};
