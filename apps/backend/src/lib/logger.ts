import { createLogger, shimLog } from "@lvksh/logger";
import chalk from "chalk";

import { Globals } from "../globals";

export const Logger = createLogger(
    {
        info: chalk.blue` INFO `,
        debug: {
            label: chalk.yellow` DEBUG `,
            tags: ["debug"],
        },
        error: chalk.red` ERROR `,
        database: chalk.cyan` DATABASE `,
        redis: chalk.redBright` REDIS `,
        influx: chalk.magentaBright` INFLUX `,
        console: chalk.green` CONSOLE `,
        panic: chalk.bgRed.white`!! PANIC !!`,
    },
    {
        exclude: Globals.mode !== "development" ? ["debug"] : [],
        postProcessors: [
            (lines, method) => {
                if (method.name !== "panic") return lines;

                process.stdout.write(lines.join("\n") + "\n");
                // eslint-disable-next-line unicorn/no-process-exit
                process.exit(1);
            },
        ],
    }
);

shimLog(Logger, "console");
