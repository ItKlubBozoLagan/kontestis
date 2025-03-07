import { hostname } from "node:os";

type GlobalsType = {
    INSTANCE_ID: string;

    mode: "development" | "production" | string;
    port: number;
    rateLimit: number;
    dbHost: string;
    dbPort: number;
    dbKeyspace: string;
    dbDatacenter: string;
    evaluatorEndpoint: string;
    redisUrl: string;
    oauthAllowedDomains: string[];
    defaultOrganisationName: string;
    influxUrl: string;
    influxToken: string;
    influxOrg: string;
    influxBucket: string;
    evaluatorServiceAccountEmail: string;
    evaluatorServiceAccountPrivateKey: Buffer | null;
    emailNotifierAccountMail: string;
    emailNotifierAccountDisplayName: string;
    emailNotifierAccountPassword: string;
    emailHost: string;
    emailPort: number;
    backendUrl: string;
    frontendUrl: string;

    evaluatorRedisQueueKey: string;
    evaluatorRedisResponseQueuePrefix: string;

    jwtSecret: string;

    aaiEduConfigurationUrl: string;
    aaiEduClientId: string;
    aaiEduClientSecret: string;
    aaiEduRedirectUri: string;
    aaiEduScopes: string[];
    captcha: {
        enabled: boolean;
        secret: string;
    };

    s3: {
        endpoint: string;
        instanceUrl: string;
        port: number;
        useSSL: boolean;
        accessKey: string;
        secretKey: string;
        buckets: {
            submission_meta: string;
        };
    };
};

export const Globals: GlobalsType = {
    INSTANCE_ID: hostname(),

    mode: process.env.MODE ?? "development",
    port: process.env.PORT ? Number.parseInt(process.env.PORT) : 8080,
    rateLimit: process.env.RATE_LIMIT ? Number.parseInt(process.env.RATE_LIMIT) : 60,
    dbHost: process.env.DB_HOST ?? "",
    dbPort: process.env.DB_PORT ? Number.parseInt(process.env.DB_PORT) : 9042,
    dbKeyspace: process.env.DB_KEYSPACE ?? "",
    dbDatacenter: process.env.DB_DATACENTER ?? "",
    evaluatorEndpoint:
        process.env.EVALUATOR_ENDPOINT ?? "https://kontestis-evaluator-y7a5esl5qq-oa.a.run.app",
    redisUrl: process.env.REDIS_URL ?? "redis://localhost:6379",
    oauthAllowedDomains: process.env.OAUTH_ALLOWED_DOMAINS
        ? process.env.OAUTH_ALLOWED_DOMAINS.split(",").filter(Boolean)
        : [],
    defaultOrganisationName: process.env.DEFAULT_ORGANISATION_NAME ?? "Kontestis",
    influxUrl: process.env.INFLUXDB_URL ?? "http://localhost:8086",
    influxToken: process.env.INFLUXDB_TOKEN ?? "devtoken",
    influxOrg: process.env.INFLUXDB_ORG ?? "kontestis-org",
    influxBucket: process.env.INFLUXDB_BUCKET ?? "kontestis",
    evaluatorServiceAccountEmail: process.env.GOOGLE_EVALUATOR_SERVICE_ACCOUNT_EMAIL ?? "",
    evaluatorServiceAccountPrivateKey: process.env
        .GOOGLE_EVALUATOR_SERVICE_ACCOUNT_PRIVATE_KEY_BASE64
        ? Buffer.from(process.env.GOOGLE_EVALUATOR_SERVICE_ACCOUNT_PRIVATE_KEY_BASE64, "base64")
        : null,
    emailHost: process.env.EMAIL_HOST ?? "localhost",
    emailPort: process.env.EMAIL_PORT ? Number.parseInt(process.env.EMAIL_PORT) : 465,
    emailNotifierAccountMail: process.env.EMAIL_ACCOUNT_MAIL ?? "test@kontestis.ac",
    emailNotifierAccountDisplayName: process.env.EMAIL_ACCOUNT_DISPLAY_NAME ?? "Kontestis",
    emailNotifierAccountPassword: process.env.EMAIL_ACCOUNT_PASSWORD ?? "",
    backendUrl: process.env.EMAIL_SETTINGS_BASE_URL ?? "http://localhost:8080",
    frontendUrl: process.env.FRONTEND_URL ?? "http://localhost:3000",
    evaluatorRedisQueueKey: process.env.EVALUATOR_QUEUE_KEY ?? "evaluator_msg_queue",
    evaluatorRedisResponseQueuePrefix:
        process.env.EVALUATOR_RESPONSE_QUEUE_CHANNEL ?? "evaluator_evaluations",
    jwtSecret: !process.env.JWT_SECRET
        ? (() => {
              throw new Error("missing JWT_SECRET");
          })()
        : process.env.JWT_SECRET,

    aaiEduConfigurationUrl:
        process.env.AAI_EDU_CONFIG_URL ??
        "https://fed-lab.aaiedu.hr/.well-known/openid-configuration",
    aaiEduClientId: process.env.AAI_EDU_CLIENT_ID ?? "",
    aaiEduClientSecret: process.env.AAI_EDU_CLIENT_SECRET ?? "",
    aaiEduRedirectUri: process.env.AAI_EDU_REDIRECT_URL ?? "http://localhost:3000/aai-login",
    aaiEduScopes: process.env.AAI_EDU_SCOPES?.split(" ") ?? [],
    captcha: {
        enabled: (process.env.CAPTCHA_DISABLED ?? "false").toLowerCase() !== "true",
        secret: process.env.CAPTCHA_SECRET ?? "",
    },
    s3: {
        endpoint: process.env.S3_ENDPOINT ?? "localhost",
        instanceUrl: process.env.S3_INSTANCE_URL ?? "http://localhost:9000",
        port: process.env.S3_PORT ? Number.parseInt(process.env.S3_PORT) : 443,
        useSSL: process.env.S3_USE_SSL === "true",
        accessKey: process.env.S3_ACCESS_KEY ?? "",
        secretKey: process.env.S3_SECRET_KEY ?? "",
        buckets: {
            submission_meta: process.env.S3_BUCKET_SUBMISSION_META ?? "submission-meta",
        },
    },
};
