import { ChildProcessWithoutNullStreams } from "node:child_process";
import { randomBytes } from "node:crypto";

import { EvaluationLanguage } from "@kontestis/models";

import { compileCLike } from "../compilers/CLikeCompiler";
import { compileGo } from "../compilers/GoCompiler";
import { compileJava } from "../compilers/JavaCompiler";
import { compileRust } from "../compilers/RustCompiler";
import { processCompilation } from "../transformers/CPPCompiledTransformer";
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
    language: Exclude<EvaluationLanguage, "python">
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
    }
};

export const compileCode: (
    code: string,
    language: EvaluationLanguage
) => Promise<RunnerFunctionResult> = async (code, language) => {
    const buffer = Buffer.from(code, "base64");

    if (language === "python") {
        return { type: "success", runner: async () => await runPython(buffer) };
    }

    const compilationResult = await processCompilation(
        getCompilationProcessForLanguage(buffer, language)
    );

    if (!compilationResult.success) console.log(compilationResult.stdErr.toString());

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
