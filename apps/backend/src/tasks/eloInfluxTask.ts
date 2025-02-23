import { Database } from "../database/Database";
import { Logger } from "../lib/logger";

export const startEloInfluxTask = async () => {
    Logger.info("Started elo Influx sync");
    setInterval(async () => {
        const users = await Database.selectFrom("users", ["id"]);

        //await Promise.all(users.map((user) => applyUserEloInInflux(user.id)));
    }, 10 * 60 * 1000);
};
