// Starts a throwaway PostgreSQL for the integration tests when DATABASE_URL is not set,
// so `pnpm test` (and the pre-commit hook) works without Docker. CI sets DATABASE_URL to
// its service container, in which case this does nothing.
import { mkdtemp, rm } from "node:fs/promises";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";

const USER = "kontestis";
const PASSWORD = "kontestis";
const DATABASE = "kontestis";

const findFreePort = () =>
    new Promise((resolve, reject) => {
        const server = createServer();

        server.unref();
        server.on("error", reject);
        server.listen(0, "127.0.0.1", () => {
            const { port } = server.address();

            server.close(() => resolve(port));
        });
    });

export default async function globalSetup() {
    if (process.env.DATABASE_URL) return;

    const { default: EmbeddedPostgres } = await import("embedded-postgres");

    const port = await findFreePort();
    const databaseDir = await mkdtemp(join(tmpdir(), "kontestis-test-pg-"));
    const logs = [];

    const postgres = new EmbeddedPostgres({
        databaseDir,
        port,
        user: USER,
        password: PASSWORD,
        persistent: false,
        // keep the unix socket inside the temp dir instead of /run/postgresql or /tmp
        postgresFlags: ["-k", databaseDir],
        onLog: (message) => logs.push(String(message)),
        onError: (error) => logs.push(String(error)),
    });

    // Set before starting so teardown can clean up even if startup fails part-way.
    globalThis.__KONTESTIS_EMBEDDED_POSTGRES__ = { postgres, databaseDir };

    try {
        await postgres.initialise();
        await postgres.start();
        await postgres.createDatabase(DATABASE);
    } catch (error) {
        console.error(logs.join("\n"));
        throw error;
    }

    process.env.DATABASE_URL = `postgresql://${USER}:${PASSWORD}@127.0.0.1:${port}/${DATABASE}`;
}

export async function globalTeardown() {
    const instance = globalThis.__KONTESTIS_EMBEDDED_POSTGRES__;

    if (!instance) return;

    await instance.postgres.stop().catch(() => {});
    await rm(instance.databaseDir, { recursive: true, force: true });
}
