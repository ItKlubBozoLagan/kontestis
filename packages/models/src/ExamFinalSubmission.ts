import { Snowflake } from "./Snowflake";

export type ExamFinalSubmissionV1 = {
    id: Snowflake;
    contest_id: Snowflake;
    user_id: Snowflake;
    submission_id: Snowflake;
};

export type ExamFinalSubmissionV2 = ExamFinalSubmissionV1 & {
    final_score: number;
};

export type ExamFinalSubmissionV3 = ExamFinalSubmissionV2 & {
    reviewed: boolean;
};

export type ExamFinalSubmission = ExamFinalSubmissionV3;
