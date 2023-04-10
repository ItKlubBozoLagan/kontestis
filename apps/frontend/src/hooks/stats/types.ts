// defined types match the ones in backend, except the ones in backend are defined by the influx client
// it wouldn't semantically make sense to put them in the common module
//  because the influx client is treated as an independent library

export type CountStat = {
    time: Date;
    count: number;
};

export type CountStatRange = "24h" | "7d" | "30d" | "1y";