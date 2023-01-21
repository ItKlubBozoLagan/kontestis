import * as Buffer from "node:buffer";
import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import fs from "node:fs";
import { chmod } from "node:fs/promises";

export const runBinary = async (binary: Buffer) => {
    const fName = randomBytes(16).toString("hex");

    fs.writeFileSync(`/tmp/${fName}`, binary);
    await chmod(`/tmp/${fName}`, 0o111);

    return spawn(`/tmp/${fName}`, {
        shell: true,
        timeout: 10_000,
    });
};
