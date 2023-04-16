export type EvaluationLanguage = "c" | "cpp" | "python" | "java" | "go" | "rust";

export type EvaluationVariant = "plain" | "checker" | "interactive";

export type SuccessfulEvaluationResult =
    | {
          type: "success";
          verdict: "accepted" | "wrong_answer" | "time_limit_exceeded" | "memory_limit_exceeded";
          time: number;
          memory: number;
      }
    | CustomSuccessfulEvaluationResult;

export type CustomSuccessfulEvaluationResult = {
    type: "success";
    verdict: "custom";
    time: number;
    memory: number;
    extra: string;
};

export type CompilationErrorResult = {
    type: "error";
    verdict: "compilation_error";
    error: string;
};

export type EvaluationResult = {
    testCaseId: string;
} & (
    | SuccessfulEvaluationResult
    | CompilationErrorResult
    | {
          type: "error";
          verdict: "runtime_error";
          exitCode: number;
      }
    | {
          type: "error";
          verdict: "evaluation_error";
      }
    | {
          type: "skipped";
          verdict: "skipped";
      }
);

export type EvaluationVerdict = EvaluationResult["verdict"];
