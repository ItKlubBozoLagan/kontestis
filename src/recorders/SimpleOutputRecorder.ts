import { Buffer } from "node:buffer";
import { ChildProcessWithoutNullStreams } from "node:child_process";

export type OutputRecord =
    | {
          success: true;
          output: Buffer;
      }
    | {
          success: false;
          exitCode: number;
          stdErr: Buffer;
      };

export type OutputRecorderFunction = (
    process: ChildProcessWithoutNullStreams,
    input: Buffer
) => Promise<OutputRecord>;

export const recordSimpleOutput: OutputRecorderFunction = (
    process: ChildProcessWithoutNullStreams,
    input: Buffer
) => {
    process.stdin.write(input);
    process.stdin.end();

    return new Promise<OutputRecord>((resolve) => {
        const stdError: Buffer[] = [];
        const stdOut: Buffer[] = [];
        let closed = false;

        // Will force terminate the program after we are sure that the time limit has passed.
        setTimeout(() => {
            if (closed) return;

            closed = true;
            process.kill();
            resolve({
                success: true,
                output: Buffer.concat(stdOut),
            });
        }, 6000);

        process.stderr.on("data", (data) => {
            if (Buffer.isBuffer(data)) stdError.push(data);

            if (typeof data === "string")
                stdError.push(Buffer.from(data, "utf8"));
        });

        process.stdout.on("data", (data) => {
            if (Buffer.isBuffer(data)) stdOut.push(data);

            if (typeof data === "string")
                stdOut.push(Buffer.from(data, "utf8"));
        });

        process.on("close", (code) => {
            if (closed) return;

            closed = true;

            if (code && code !== 0)
                return resolve({
                    success: false,
                    exitCode: code,
                    stdErr: Buffer.concat(stdError),
                });

            resolve({
                success: true,
                output: Buffer.concat(stdOut),
            });
        });
    });
};
