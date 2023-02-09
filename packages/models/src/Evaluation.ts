export type EvaluationLanguage = "c" | "cpp" | "python";

export type EvaluationVariant = "plain" | "script" | "interactive";

export type SuccessfulEvaluationResult = {
    type: "success";
    verdict: "accepted" | "wrong_answer" | "time_limit_exceeded" | "memory_limit_exceeded";
    time: number;
    memory: number;
};

export type EvaluationResult = {
    testCaseId: string;
} & (
    | SuccessfulEvaluationResult
    | {
          type: "error";
          verdict: "runtime_error";
          exitCode: number;
      }
    | {
          type: "error";
          verdict: "compilation_error" | "evaluation_error" | "system_error";
      }
);

export type EvaluationVerdict = EvaluationResult["verdict"];
