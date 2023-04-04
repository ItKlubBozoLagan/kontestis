import { Globals } from "../globals";
import { createInfluxClient, InfluxUInteger } from "./InfluxClient";

export const Influx = createInfluxClient<{
    elo: {
        values: {
            score: InfluxUInteger;
        };
        tags: ["userId", "orgId"];
    };
}>({
    url: Globals.influxUrl,
    token: Globals.influxToken,
    org: Globals.influxOrg,
    bucket: Globals.influxBucket,
});

export const initInflux = () => Promise.resolve();
