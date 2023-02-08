import { createClient } from "redis";

import { Globals } from "../globals";

export const Redis = createClient({
    url: Globals.redisUrl,
});
