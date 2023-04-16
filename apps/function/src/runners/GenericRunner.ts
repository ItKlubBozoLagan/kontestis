import { ChildProcessWithoutNullStreams } from "node:child_process";
import { randomBytes } from "node:crypto";

import { EvaluationLanguage } from "@kontestis/models";

import { CompilationProcessInfo, compileCLike } from "../compilers/CLikeCompiler";
import { compileGo } from "../compilers/GoCompiler";
import { processCompiled } from "../transformers/CPPCompiledTransformer";
import { runBinary } from "./BinaryRunner";
import { runPython } from "./PythonRunner";

export type RunnableProcess = () => Promise<ChildProcessWithoutNullStreams>;

type RunnerFunctionResult =
    | {
          type: "success";
          runner: RunnableProcess;
      }
    | {
          type: "compilation_error";
          error: string;
      };

const getCompilationProcessForLanguage = (
    code: Buffer,
    language: Exclude<EvaluationLanguage, "python" | "java">
): CompilationProcessInfo => {
    const outFileName = randomBytes(16).toString("hex");

    if (language === "c" || language === "cpp")
        return {
            outFile: outFileName,
            startCompilation: compileCLike(language, code, outFileName),
        };

    if (language === "go") {
        return {
            outFile: outFileName,
            startCompilation: compileGo(code, outFileName),
        };
    }

    throw new Error("unsupported");
};

export const compileCode: (
    code: string,
    lang: EvaluationLanguage
) => Promise<RunnerFunctionResult> = async (code, language) => {
    const buffer = Buffer.from(code, "base64");

    if (language === "python") {
        return { type: "success", runner: async () => await runPython(buffer) };
    }

    if (language === "java") {
        throw new Error("unsupported");
    }

    const compilationResult = await processCompiled(
        getCompilationProcessForLanguage(buffer, language)
    );

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
