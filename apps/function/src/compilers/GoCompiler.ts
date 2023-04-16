import { Buffer } from "node:buffer";
import { spawn } from "node:child_process";
import { writeFileSync } from "node:fs";

import { CompilationProcessInfo } from "./CLikeCompiler";

export const compileGo =
    (code: Buffer, outFileName: string): CompilationProcessInfo["startCompilation"] =>
    () => {
        const outFilePath = `/tmp/${outFileName}`;

        writeFileSync(outFilePath + ".go", code);

        const process = spawn("/usr/bin/go", ["build", "-o", outFilePath, outFilePath + ".go"], {
            shell: true,
            env: {
                GOCACHE: "/home/node/.cache",
                GOFLAGS: "-count=1",
            },
        });

        process.stdin.write(code);
        process.stdin.end();

        return process;
    };
