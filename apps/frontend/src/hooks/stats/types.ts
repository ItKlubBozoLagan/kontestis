// defined types match the ones in backend, except the ones in backend are defined by the influx client
// it wouldn't semantically make sense to put them in the common module
//  because the influx client is treated as an independent library

export type StringLiteral<T extends string> = string extends T ? never : T;

export type StatisticResult<K extends string> = {
    time: Date;
} & {
    [key in StringLiteral<K>]: number;
};

export type CountStatistic = StatisticResult<"count">;

export type LastStatistic = StatisticResult<"last">;

export type CountStatisticWithPeriod = {
    stats: CountStatistic[];
    previousPeriodChange: number;
};

export type StatisticRange = "24h" | "7d" | "30d" | "1y";
