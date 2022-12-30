import {ChildProcessWithoutNullStreams} from "child_process";
import {Buffer} from "buffer";

export type OutputRecord = {
    success: true,
    output: Buffer,
} | {
    success: false,
    exitCode: number,
    stdErr: Buffer
};


export const recordSimpleOutput = (process: ChildProcessWithoutNullStreams, input: Buffer) => {

  //  console.log("Recording output: !")

    process.stdin.write(input);
    process.stdin.end();

    return new Promise<OutputRecord>((resolve) => {
       const stdErr: Buffer[] = [];
       const stdOut: Buffer[] = [];

       process.stderr.on("data", data => {
           //console.log("Data: " + data);
           if(Buffer.isBuffer(data))
               stdErr.push(data);
           if(typeof data === "string")
               stdErr.push(new Buffer(data, "utf-8"));
       });

       process.stdout.on("data", data => {
        //   console.log("Out: " + data);
           if(Buffer.isBuffer(data))
               stdOut.push(data);
           if(typeof data === "string")
               stdOut.push(new Buffer(data, "utf-8"));
       });

       process.on("close", (code) => {
       //    console.log("Closed: " + code);
          if(code && code !== 0)
              return resolve({
                  success: false,
                  exitCode: code,
                  stdErr: Buffer.concat(stdErr)
              });
          resolve({
              success: true,
              output: Buffer.concat(stdOut)
          });
       });
    });
};