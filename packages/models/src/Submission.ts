import { EvaluationLanguage, EvaluationVerdict } from "./Evaluation";
import { Snowflake } from "./Snowflake";

export type SubmissionV1 = {
    id: Snowflake;
    user_id: Snowflake;
    problem_id: Snowflake;
    language: EvaluationLanguage;
    code: string;

    verdict?: EvaluationVerdict;
    awardedscore?: number;

    time_used_millis?: number;
    memory_used_megabytes?: number;

    completed: boolean;
};

export type SubmissionV2 = Omit<SubmissionV1, "awardedscore"> & {
    awarded_score?: number;
};

export type SubmissionV3 = SubmissionV2 & { created_at: Date };

export type SubmissionV4 = Omit<SubmissionV3, "verdict" | "awarded_score" | "completed"> & {
    verdict: EvaluationVerdict;
    awarded_score: number;
};

export type SubmissionV5 = Omit<SubmissionV4, "verdict"> &
    (
        | {
              verdict: Exclude<EvaluationVerdict, "compilation_error">;
          }
        | {
              verdict: Extract<EvaluationVerdict, "compilation_error">;
              error: string;
          }
    );

export type Submission = SubmissionV5;

export type SubmissionWithUserInfo = Submission & {
    full_name: string;
    email: string;
};

export type PendingSubmission = Omit<
    Submission,
    "verdict" | "awarded_score" | "problem_id" | "time_used_millis" | "memory_used_megabytes"
>;

export type SubmissionByProblemResponse =
    | ({
          completed: true;
      } & Submission)
    | ({
          completed: false;
      } & PendingSubmission);
