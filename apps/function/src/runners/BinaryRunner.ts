import { spawn } from "node:child_process";
import { SpawnOptionsWithoutStdio } from "node:child_process";
import { chmod } from "node:fs/promises";

export const runBinary = async (
    path: string,
    spawnArguments?: string[],
    spawnOptions?: SpawnOptionsWithoutStdio,
    changePermissions: boolean = true
) => {
    if (changePermissions) await chmod(path, 0o111);

    return spawn(path, spawnArguments, {
        ...spawnOptions,
        shell: true,
        timeout: 5000,
    });
};
