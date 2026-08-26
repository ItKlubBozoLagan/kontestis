import { config as dotenvConfig } from "dotenv";

dotenvConfig();

import { Database, initDatabase } from "./Database";

const run = async () => {
    await Database.awaitConnection();
    await initDatabase();
    await Database.shutdown();
};

run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
