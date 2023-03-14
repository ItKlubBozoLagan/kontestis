export type EvaluationLanguage = "c" | "cpp" | "python";

export type EvaluationVariant = "plain" | "script" | "interactive";

export type SuccessfulEvaluationResult = {
    type: "success";
    verdict: "accepted" | "wrong_answer" | "time_limit_exceeded" | "memory_limit_exceeded";
    time: number;
    memory: number;
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
          verdict: "evaluation_error" | "system_error";
      }
    | {
          type: "skipped";
          verdict: "skipped";
      }
);

export type EvaluationVerdict = EvaluationResult["verdict"];
