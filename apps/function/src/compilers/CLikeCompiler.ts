import { Buffer } from "node:buffer";
import { spawn } from "node:child_process";

import { EvaluationLanguage } from "@kontestis/models";

import { CompilationProcessInfo } from "../runners/GenericRunner";

export const compileCLike =
    (
        variant: Extract<EvaluationLanguage, "c" | "cpp">,
        code: Buffer,
        outFileName: string
    ): CompilationProcessInfo["startCompilation"] =>
    () => {
        const process = spawn(
            variant === "cpp" ? "/usr/bin/g++" : "/usr/bin/gcc",
            [
                "-O3",
                "-Wall",
                "-o",
                `/tmp/${outFileName}`,
                "-x",
                variant === "cpp" ? "c++" : "c",
                "-",
            ],
            {
                shell: true,
            }
        );

        process.stdin.write(code);
        process.stdin.end();

        return process;
    };
