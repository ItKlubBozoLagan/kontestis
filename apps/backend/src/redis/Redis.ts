import { createClient } from "redis";

import { Globals } from "../globals";

type RedisType = ReturnType<typeof createClient>;

export const Redis: RedisType = createClient({
    url: Globals.redisUrl,
});
