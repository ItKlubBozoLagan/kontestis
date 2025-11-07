export type EvaluationLanguage =
    | "c"
    | "cpp"
    | "python"
    | "java"
    | "go"
    | "rust"
    | "gnu_asm_x86_linux"
    | "o_caml"
    | "output-only";

export type EvaluationVariant = "plain" | "checker" | "interactive" | "output-only";

export type SuccessfulEvaluationResult =
    | {
          type: "success";
          verdict: "accepted" | "wrong_answer" | "time_limit_exceeded" | "memory_limit_exceeded";
          time: number;
          memory: number;
          output?: string;
      }
    | CustomSuccessfulEvaluationResult;

export type CustomSuccessfulEvaluationResult = {
    type: "success";
    verdict: "custom";
    time: number;
    memory: number;
    extra: string;
    output?: string;
};

export type CompilationErrorResult = {
    type: "error";
    verdict: "compilation_error";
    error: string;
};

export type EvaluationResult = {
    testCaseId: string;
    compiler_output?: string;
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
