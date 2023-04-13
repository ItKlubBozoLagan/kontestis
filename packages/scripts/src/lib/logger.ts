import { createLogger, shimLog } from "@lvksh/logger";
import chalk from "chalk";

export const Logger = createLogger({
    info: chalk.blue` INFO `,
    error: chalk.red` ERROR `,
    console: chalk.green` CONSOLE `,
});

shimLog(Logger, "console");
