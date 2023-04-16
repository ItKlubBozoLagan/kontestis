import { Buffer } from "node:buffer";
import { ChildProcessWithoutNullStreams, spawn } from "node:child_process";

export type CompilationProcessInfo = {
    outFile: string;
    startCompilation: () => ChildProcessWithoutNullStreams;
};

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
