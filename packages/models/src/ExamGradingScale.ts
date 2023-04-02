import { Snowflake } from "./Snowflake";

export type ExamGradingScaleV1 = {
    id: Snowflake;
    contest_id: Snowflake;
    percentage: number;
    grade: string;
};

export type ExamGradingScale = ExamGradingScaleV1;
