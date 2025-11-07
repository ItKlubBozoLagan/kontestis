import { ChildProcessWithoutNullStreams } from "node:child_process";
import { randomBytes } from "node:crypto";

import { EvaluationLanguage } from "@kontestis/models";

import { compileCLike } from "../compilers/CLikeCompiler";
import { compileGo } from "../compilers/GoCompiler";
import { compileJava } from "../compilers/JavaCompiler";
import { compileRust } from "../compilers/RustCompiler";
import { processCompilation } from "../transformers/CompiledTransformer";
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

export type CompilationProcessInfo = {
    outFile: string;
    startCompilation: () => ChildProcessWithoutNullStreams;
};

const getCompilationProcessForLanguage = (
    code: Buffer,
    language: Exclude<EvaluationLanguage, "python" | "output-only">
): CompilationProcessInfo => {
    const outFileName = randomBytes(16).toString("hex");

    switch (language) {
        case "c":
        case "cpp":
            return {
                outFile: outFileName,
                startCompilation: compileCLike(language, code, outFileName),
            };
        case "go":
            return {
                outFile: outFileName,
                startCompilation: compileGo(code, outFileName),
            };
        case "rust":
            return {
                outFile: outFileName,
                startCompilation: compileRust(code, outFileName),
            };
        case "java":
            return {
                outFile: outFileName,
                startCompilation: compileJava(code, outFileName),
            };
        case "gnu_asm_x86_linux":
            throw new Error("GNU Assembly is not supported");
        case "ocaml":
            throw new Error("OCaml is not supported");
    }
};

export const compileCode: (
    code: string,
    language: EvaluationLanguage
) => Promise<RunnerFunctionResult> = async (code, language) => {
    const buffer = Buffer.from(code, "base64");

    if (language === "python") {
        return {
            type: "success",
            runner: () => runPython(buffer),
        };
    }

    if (language === "output-only") {
        return {
            type: "compilation_error",
            error: "Output only format is not supported here!",
        };
    }

    const compilationResult = await processCompilation(
        getCompilationProcessForLanguage(buffer, language)
    );

    if (!compilationResult.success) {
        return {
            type: "compilation_error",
            error: compilationResult.stdErr.toString("utf8"),
        };
    }

    if (language === "java") {
        return {
            type: "success",
            runner: () =>
                runBinary(
                    "/usr/bin/java",
                    ["Main"],
                    {
                        // in case of java, this is the directory with the compiled class
                        cwd: compilationResult.outFilePath,
                    },
                    false
                ),
        };
    }

    return {
        type: "success",
        runner: () => runBinary(compilationResult.outFilePath),
    };
};
