import { Buffer } from "node:buffer";
import { spawn } from "node:child_process";
import { writeFileSync } from "node:fs";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

import { CompilationProcessInfo } from "../runners/GenericRunner";

export const compileJava =
    (code: Buffer, outFileName: string): CompilationProcessInfo["startCompilation"] =>
    () => {
        const outFileDirectory = `/tmp/${outFileName}`;
        const outFilePath = join(outFileDirectory, "Main.java");

        mkdirSync(outFileDirectory);
        writeFileSync(outFilePath, code);

        return spawn("/usr/bin/javac", ["-d", outFileDirectory, outFilePath], {
            shell: true,
        });
    };
