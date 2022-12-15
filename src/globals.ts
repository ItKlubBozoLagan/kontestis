
type Globals = {
    port: number,
    tokenSecret: string,
    dbHost: string,
    dbPort: number,
    dbKeySpace: string,
    dbDatacenter: string
};

export const Globals: Globals = {
    port: process.env.PORT ? parseInt(process.env.PORT) : 8080,
    tokenSecret: process.env.TOKEN_SECRET ?? "",
    dbHost: process.env.DB_HOST ?? "", 
    dbPort: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 9042,
    dbKeySpace: process.env.DB_KEYSPACE ?? "",
    dbDatacenter: process.env.DB_DATACENTER ?? ""
};