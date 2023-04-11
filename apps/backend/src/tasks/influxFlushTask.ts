import { Influx } from "../influx/Influx";
import { Logger } from "../lib/logger";

export const startInfluxFlushTask = async () => {
    Logger.info("Started Influx task");
    setInterval(Influx.flush, 2000);
};
