import { createLogger } from "@lvksh/logger";
import chalk from "chalk";

export const Logger = createLogger(
    {
        info: chalk.blue` INFO `,
        debug: chalk.yellow` DEBUG `,
        database: chalk.cyan` DATABASE `,
        redis: chalk.redBright` REDIS `,
        panic: chalk.bgRed.white`!! PANIC !!`,
    },
    {
        postProcessors: [
            (lines, method) => {
                if (method.name !== "panic") return lines;

                process.stdout.write(lines.join("\n") + "\n");
                // eslint-disable-next-line unicorn/no-process-exit
                process.exit(1);

                return lines;
            },
        ],
    }
);
