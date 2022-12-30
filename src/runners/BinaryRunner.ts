import * as Buffer from "buffer";
import {randomBytes} from "crypto";
import fs from "fs";
import {spawn} from "child_process";
import {chmod} from "fs/promises";


export const runBinary = async (binary: Buffer) => {
    const fName = randomBytes(16).toString("hex");
    fs.writeFileSync(`/tmp/${fName}`, binary);
    await chmod(`/tmp/${fName}`, 0o111)
    return spawn(`/tmp/${fName}`, {
        shell: true,
        timeout: 5000
    });
}