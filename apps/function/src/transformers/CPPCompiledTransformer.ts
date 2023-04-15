import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { readFile } from "node:fs/promises";

import { EvaluationLanguage } from "@kontestis/models";

type CompileResult =
    | {
          success: true;
          binary: Buffer;
      }
    | {
          success: false;
          exitCode: number;
          stdErr: Buffer;
      };

export const transformToBinary = async (
    variant: EvaluationLanguage,
    code: Buffer
): Promise<CompileResult> => {
    const fName = randomBytes(16).toString("hex");

    const compile = spawn(
        variant === "cpp" ? "/usr/bin/g++" : "/usr/bin/gcc",
        ["-O3", "-Wall", "-o", `/tmp/${fName}`, "-x", variant === "cpp" ? "c++" : "c", "-"],
        {
            shell: true,
        }
    );

    compile.stdin.write(code);
    compile.stdin.end();

    return new Promise((resolve) => {
        const stdError: Buffer[] = [];

        compile.stderr.on("data", (data) => {
            if (Buffer.isBuffer(data)) stdError.push(data);

            if (typeof data === "string") stdError.push(Buffer.from(data, "utf8"));
        });

        compile.on("close", async (code) => {
            if (code && code !== 0)
                return resolve({
                    success: false,
                    exitCode: code,
                    stdErr: Buffer.concat(stdError),
                });

            try {
                resolve({
                    success: true,
                    binary: await readFile(`/tmp/${fName}`),
                });
            } catch {
                resolve({
                    success: false,
                    exitCode: 1,
                    stdErr: Buffer.from(""),
                });
            }
        });
    });
};
