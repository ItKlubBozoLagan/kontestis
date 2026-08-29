declare module "rate-limit-redis" {
    const RedisStore: new (options: {
        prefix?: string;
        sendCommand: (...arguments_: string[]) => Promise<unknown>;
    }) => import("express-rate-limit").Store;

    export default RedisStore;
}
