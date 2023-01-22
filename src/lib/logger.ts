import { createLogger } from "@lvksh/logger";
import chalk from "chalk";

export const Logger = createLogger({
    info: chalk.blue` INFO `,
    debug: chalk.yellow` DEBUG `,
    database: chalk.cyan` DATABASE `,
});
