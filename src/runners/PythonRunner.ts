import Buffer from "buffer";
import {randomBytes} from "crypto";
import fs from "fs";
import {spawn} from "child_process";

export const runPython = (python: Buffer) => {
    const fName = randomBytes(16).toString("hex");
    fs.writeFileSync(`/tmp/${fName}`, python);
    return spawn(`/usr/bin/python3`, [`/tmp/${fName}`], {
        shell: true,
        timeout: 5000
    });
}