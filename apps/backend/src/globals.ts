type GlobalsType = {
    mode: "development" | "production" | string;
    port: number;
    tokenSecret: string;
    dbHost: string;
    dbPort: number;
    dbKeyspace: string;
    dbDatacenter: string;
    evaluatorEndpoint: string;
    redisUrl: string;
    oauthClientId: string;
    oauthAllowedDomains: string[];
    defaultOrganisationName: string;
    influxUrl: string;
    influxToken: string;
    influxOrg: string;
    influxBucket: string;
};

export const Globals: GlobalsType = {
    mode: process.env.MODE ?? "development",
    port: process.env.PORT ? Number.parseInt(process.env.PORT) : 8080,
    tokenSecret: process.env.TOKEN_SECRET ?? "",
    dbHost: process.env.DB_HOST ?? "",
    dbPort: process.env.DB_PORT ? Number.parseInt(process.env.DB_PORT) : 9042,
    dbKeyspace: process.env.DB_KEYSPACE ?? "",
    dbDatacenter: process.env.DB_DATACENTER ?? "",
    evaluatorEndpoint:
        process.env.EVALUATOR_ENDPOINT ?? "https://kontestis-evaluator-y7a5esl5qq-oa.a.run.app",
    redisUrl: process.env.REDIS_URL ?? "redis://localhost:6379",
    oauthClientId: process.env.OAUTH_CLIENT_ID ?? "",
    oauthAllowedDomains: process.env.OAUTH_ALLOWED_DOMAINS
        ? process.env.OAUTH_ALLOWED_DOMAINS.split(",").filter(Boolean)
        : [],
    defaultOrganisationName: process.env.DEFAULT_ORGANISATION_NAME ?? "Kontestis",
    influxUrl: process.env.INFLUXDB_URL ?? "http://localhost:8086",
    influxToken: process.env.INFLUXDB_TOKEN ?? "devtoken",
    influxOrg: process.env.INFLUXDB_ORG ?? "kontestis-org",
    influxBucket: process.env.INFLUXDB_BUCKET ?? "kontestis",
};
