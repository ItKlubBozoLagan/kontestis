import { Buffer } from "node:buffer";
import { spawn } from "node:child_process";

import { CompilationProcessInfo } from "../runners/GenericRunner";

export const compileRust =
    (code: Buffer, outFileName: string): CompilationProcessInfo["startCompilation"] =>
    () => {
        const process = spawn("/usr/bin/rustc", ["-o", `/tmp/${outFileName}`, "-"], {
            shell: true,
        });

        process.stdin.write(code);
        process.stdin.end();

        return process;
    };
