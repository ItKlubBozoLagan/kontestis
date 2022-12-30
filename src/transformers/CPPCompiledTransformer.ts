import { spawn } from "child_process";
import { randomBytes } from "crypto";
import {chmod, readFile, writeFile} from "fs/promises";

type CompileResult = {
    success: true,
    binary: Buffer
} | {
    success: false,
    exitCode: number,
    stdErr: Buffer
}

export const transformToBinary = async (code: Buffer): Promise<CompileResult> => {
    const fName = randomBytes(16).toString("hex");

    const compile = spawn("/usr/bin/g++", ["-O3", "-Wall", "-o", `/tmp/${fName}`, "-x", "c++", "-"], {
        shell: true,
        timeout: 5000
    });
    compile.stdin.write(code);
    compile.stdin.end();

    return new Promise(resolve => {
        const stdErr: Buffer[] = [];

        compile.stderr.on("data", data => {
            if (Buffer.isBuffer(data))
                stdErr.push(data);

            if (typeof data === "string")
                stdErr.push(new Buffer(data, "utf-8"));
        })

        compile.on("close", async code => {
            if (code && code !== 0)
                return resolve({
                    success: false,
                    exitCode: code,
                    stdErr: Buffer.concat(stdErr)
                })

            resolve({
                success: true,
                binary: await readFile(`/tmp/${fName}`)
            })
        })
    })
}

/*

const code = `
#include<bits/stdc++.h>

int main(int argc, char** argv) {
    printf("argc: %d | argv0: %s\\n", argc, argv[0]);
    return 0;
}
`;

(async () => {
    const compiled = await transformToBinary(Buffer.from(code, "utf-8"));
    console.log("result", compiled);

    if (compiled.success) {
        await writeFile("/tmp/testedCompile", compiled.binary);
        await chmod("/tmp/testedCompile", 0o111)
    } else {
        console.log(compiled.stdErr.toString("utf-8"));
    }
})()
 */
