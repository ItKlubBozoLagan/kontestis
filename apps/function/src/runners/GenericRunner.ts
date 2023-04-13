import { ChildProcessWithoutNullStreams } from "node:child_process";

import { EvaluationLanguage } from "@kontestis/models";

import { transformToBinary } from "../transformers/CPPCompiledTransformer";
import { runBinary } from "./BinaryRunner";
import { runPython } from "./PythonRunner";

type RunnerFunctionResult =
    | {
          type: "success";
          runner: () => Promise<ChildProcessWithoutNullStreams>;
      }
    | {
          type: "compilation_error";
          error: string;
      };

export const getRunnerFunction: (
    code: string,
    lang: EvaluationLanguage
) => Promise<RunnerFunctionResult> = async (code, lang) => {
    const buffer = Buffer.from(code, "base64");

    if (lang === "python") {
        return { type: "success", runner: async () => await runPython(buffer) };
    }

    const compilationResult = await transformToBinary(lang, buffer);

    if (!compilationResult.success) {
        return {
            type: "compilation_error",
            error: compilationResult.stdErr.toString("utf8"),
        };
    }

    return {
        type: "success",
        runner: () => runBinary(compilationResult.binary),
    };
};