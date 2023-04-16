import { CompilationProcessInfo } from "../runners/GenericRunner";

type CompileResult =
    | {
          success: true;
          outFilePath: string;
      }
    | {
          success: false;
          exitCode: number;
          stdErr: Buffer;
      };

export const processCompilation = async (
    compilationInfo: CompilationProcessInfo
): Promise<CompileResult> => {
    const { startCompilation, outFile } = compilationInfo;

    const compilationProcess = startCompilation();

    return new Promise((resolve) => {
        const stdError: Buffer[] = [];

        compilationProcess.stderr.on("data", (data) => {
            if (Buffer.isBuffer(data)) stdError.push(data);

            if (typeof data === "string") stdError.push(Buffer.from(data, "utf8"));
        });

        compilationProcess.on("close", async (code) => {
            if (code && code !== 0)
                return resolve({
                    success: false,
                    exitCode: code,
                    stdErr: Buffer.concat(stdError),
                });

            try {
                resolve({
                    success: true,
                    outFilePath: `/tmp/${outFile}`,
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
