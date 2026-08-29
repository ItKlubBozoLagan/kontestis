export type StringLiteral<T extends string> = string extends T ? never : T;

export type StatisticResult<K extends string> = {
    time: Date;
} & {
    [key in StringLiteral<K>]: number;
};

export type LastStatistic = StatisticResult<"last">;

export type StatisticRange = "24h" | "7d" | "30d" | "1y";
