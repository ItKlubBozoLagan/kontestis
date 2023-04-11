import Buffer from "node:buffer";
import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import fs from "node:fs";

export const runPython = async (python: Buffer) => {
    const fName = randomBytes(16).toString("hex");

    fs.writeFileSync(`/tmp/${fName}`, python);

    return spawn("/usr/bin/python3", [`/tmp/${fName}`], {
        shell: true,
        timeout: 5000,
    });
};
