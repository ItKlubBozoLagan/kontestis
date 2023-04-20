import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import fs from "node:fs";

export const runESL = async (esl: Buffer) => {
    const fileName = randomBytes(16).toString("hex");

    fs.writeFileSync(`/tmp/${fileName}.esl`, esl);

    return spawn("/usr/bin/esl", [`/tmp/${fileName}.esl`], {
        shell: true,
        timeout: 5000,
    });
};
