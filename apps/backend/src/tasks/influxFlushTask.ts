import { Influx } from "../influx/Influx";

export const startInfluxFlushTask = async () => {
    setInterval(Influx.flush, 2000);
};
