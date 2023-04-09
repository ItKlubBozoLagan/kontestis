import { Globals } from "../globals";
import { Logger } from "../lib/logger";
import { createInfluxClient, InfluxUInteger } from "./InfluxClient";

// schema here could be improved, but it would require some changes to the client
//  and we kind of don't have time for that, it is good enough for now
export const Influx = createInfluxClient<{
    elo: {
        values: {
            score: InfluxUInteger;
        };
        tags: ["userId", "orgId"];
    };
    submissions: {
        values: {
            // no real meaning, but this has to exist
            id: InfluxUInteger;
        };
        tags: ["userId", "orgId", "successful"];
    };
    logins: {
        values: {
            // no real meaning, but this has to exist
            happened: true;
        };
        tags: ["userId", "newLogin"];
    };
    activity: {
        values: {
            // no real meaning, but this has to exist
            happened: true;
        };
        tags: ["statusCode"];
    };
}>({
    url: Globals.influxUrl,
    token: Globals.influxToken,
    org: Globals.influxOrg,
    bucket: Globals.influxBucket,
    debug: Globals.mode === "development" ? Logger.influx : undefined,
});

export const initInflux = () => Promise.resolve();
