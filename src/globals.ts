type GlobalsType = {
    port: number;
    tokenSecret: string;
    dbHost: string;
    dbPort: number;
    dbKeyspace: string;
    dbDatacenter: string;
    evaluatorURL: string;
};

export const Globals: GlobalsType = {
    port: process.env.PORT ? Number.parseInt(process.env.PORT) : 8080,
    tokenSecret: process.env.TOKEN_SECRET ?? "",
    dbHost: process.env.DB_HOST ?? "",
    dbPort: process.env.DB_PORT ? Number.parseInt(process.env.DB_PORT) : 9042,
    dbKeyspace: process.env.DB_KEYSPACE ?? "",
    dbDatacenter: process.env.DB_DATACENTER ?? "",
    evaluatorURL: process.env.EVALUATOR_URL ?? "http://localhost:8081",
};
