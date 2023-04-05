import { Agent } from "node:http";

import {
    ColumnType,
    flux,
    fluxDateTime,
    FluxTableMetaData,
    InfluxDB,
    ParameterizedQuery,
    QueryApi,
    WriteApi,
} from "@influxdata/influxdb-client";
import { DeleteAPI } from "@influxdata/influxdb-client-apis";

import { R } from "../utils/remeda";

const tomorrow = () => new Date(Date.now() + 24 * 60 * 60 * 1000);

const InfluxUIntegerSymbol = Symbol.for("influxdb/types/uinteger");

export type InfluxUInteger = { [InfluxUIntegerSymbol]: bigint; asBigInt: bigint };

export const createInfluxUInt = (value: bigint | number): InfluxUInteger => {
    if (typeof value === "number" && value > Number.MAX_SAFE_INTEGER)
        throw new Error("createInfluxUInt: number is too big (number unsafe)");

    if (value > 1n << 64n) throw new Error("createInfluxUInt: number is too big (64 bit)");

    const asBigInt = BigInt(value);

    return {
        [InfluxUIntegerSymbol]: asBigInt,
        asBigInt,
    };
};

// could be expanded, but we're not writing a library here
//  yet...
type InfluxLineType = string | number | bigint | boolean | InfluxUInteger;

const stringifyInfluxType = (type: InfluxLineType) => {
    switch (typeof type) {
        case "string":
            // probably not the safest, but it'll do
            // eslint-disable-next-line quotes
            return `"${type.replace(/"/g, '\\"')}"`;
        case "bigint":
            return `${type}i`;
        case "number":
        case "boolean":
            return type.toString();
    }

    return `${type[InfluxUIntegerSymbol]}u`;
};

const valueToTypeStrict = (value: string, columnType: ColumnType) => {
    switch (columnType) {
        case "string":
            return value;
        case "long":
            return BigInt(value);
        case "unsignedLong":
            return createInfluxUInt(BigInt(value));
        case "double":
            return Number(value);
        case "boolean":
            return Boolean(value);
        case "base64Binary":
            return Buffer.from(value, "base64");
        case "dateTime:RFC3339":
            return new Date(value);
        case "duration":
            return { duration: value };
        default:
            return value;
    }
};

type InfluxCreateOptions = {
    url: string;
    token: string;
    org: string;
    bucket: string;
    debug?: boolean | ((...data: string[]) => void);
};

type InfluxMeasurement = {
    values: Record<string, InfluxLineType>;
    tags: string[];
};

export type InfluxLine = string;
export type InfluxDataSchema = Record<string, InfluxMeasurement>;
export type InfluxQueryResult<T extends InfluxDataSchema, K extends keyof T> = (T[K]["values"] & {
    time: Date;
})[];

export type InfluxClient<T extends InfluxDataSchema> = {
    createLine<K extends keyof T & string>(
        measurement: K,
        tags: Record<T[K]["tags"][number], string>,
        values: T[K]["values"],
        date?: Date
    ): InfluxLine;
    insert<K extends keyof T & string>(
        measurement: K,
        tags: Record<T[K]["tags"][number], string>,
        values: T[K]["values"],
        date?: Date
    ): Promise<void>;
    insertMany(lines: InfluxLine[]): Promise<void>;
    queryRaw(flux: ParameterizedQuery): Promise<unknown>;
    query<K extends keyof T & string>(
        measurement: K,
        tags: Record<T[K]["tags"][number], string>,
        start?: Date,
        end?: Date
    ): Promise<InfluxQueryResult<T, K>>;
    // will add more complex delete mechanics as we need them
    dropMeasurement<K extends keyof T & string>(measurement: K): Promise<void>;
    _writeApi: WriteApi;
    _readApi: QueryApi;
    _deleteApi: DeleteAPI;
};

const defaultRowMapper = (
    values: string[],
    tableMeta: FluxTableMetaData
): Record<string, unknown> => {
    return R.fromPairs(
        R.pipe(
            R.zip(values, tableMeta.columns),
            R.map.indexed(([value, meta], index) => [
                meta.label ?? `_unknown_${index}`,
                valueToTypeStrict(value, meta.dataType),
            ])
        )
    );
};

export const createInfluxClient = <T extends InfluxDataSchema>(
    config: InfluxCreateOptions
): InfluxClient<T> => {
    const keepAliveAgent = new Agent({
        keepAlive: true,
        keepAliveMsecs: 20 * 1000,
    });

    const influxdb = new InfluxDB({
        url: config.url,
        token: config.token,
        transportOptions: { agent: keepAliveAgent },
    });

    const influxWriteApi = influxdb.getWriteApi(config.org, config.bucket, "ms");
    const influxReadApi = influxdb.getQueryApi(config.org);
    const influxDeleteApi: DeleteAPI = new DeleteAPI(influxdb);

    process.on("exit", async () => {
        keepAliveAgent.destroy();
    });

    const debugFunction = (...data: string[]): void => {
        if (!config.debug) return;

        if (typeof config.debug === "boolean") return console.log(...data);

        config.debug(...data);
    };

    const createLine = <K extends keyof T & string>(
        measurement: K,
        tags: Record<T[K]["tags"][number], string>,
        values: T[K]["values"],
        date: Date = new Date()
    ): InfluxLine =>
        `${measurement}${Object.entries(tags)
            .map(([key, value]) => `,${key}=${value}`)
            .join("")} ${Object.entries(values)
            .map(([key, value]) => `${key}=${stringifyInfluxType(value)}`)
            .join(",")} ${date.getTime()}`;

    return {
        createLine,
        insert: <K extends keyof T & string>(
            measurement: K,
            tags: Record<T[K]["tags"][number], string>,
            values: T[K]["values"],
            date: Date = new Date()
        ) => {
            const line = createLine(measurement, tags, values, date);

            debugFunction("[InfluxDB] Writing", line);
            influxWriteApi.writeRecords([line]);

            return influxWriteApi.flush();
        },
        insertMany: (lines: InfluxLine[]) => {
            debugFunction("[InfluxDB] Writing", ...lines);
            influxWriteApi.writeRecords(lines);

            return influxWriteApi.flush();
        },
        queryRaw: <T>(
            query: string | ParameterizedQuery,
            rowMapper?: (values: string[], tableMeta: FluxTableMetaData) => T | undefined
        ) => {
            return influxReadApi.collectRows(query, rowMapper);
        },
        query: async <K extends keyof T & string>(
            measurement: K,
            tags: Record<T[K]["tags"][number], string>,
            start: Date = new Date(0),
            end: Date = tomorrow() // adjust for timezones
        ) => {
            const query =
                flux`
                from(bucket: "${config.bucket}")
                    |> range(
                        start: ${fluxDateTime(start.toISOString())},
                        stop: ${fluxDateTime(end.toISOString())}
                    )
                    |> filter(fn: (r) => r["_measurement"] == "${measurement}")
            ` +
                Object.entries(tags)
                    .map(([key, value]) => flux`|> filter(fn: (r) => r["${key}"] == "${value}")`)
                    .join(" ");

            debugFunction("[InfluxDB] Querying", query.toString());

            const result = await influxReadApi.collectRows(query, defaultRowMapper);

            // could be made more efficient, but it's readable
            return R.pipe(
                result,
                R.filter((it) => "_time" in it && it["_time"] instanceof Date),
                R.groupBy((it) => (it["_time"] as Date).toISOString()),
                R.toPairs,
                R.map(([date, entries]) => ({
                    time: new Date(date),
                    ...R.pipe(
                        entries,
                        R.filter((it) => "_field" in it && "_value" in it),
                        R.map((it) => [it["_field"], it["_value"]] as [string, unknown]),
                        R.fromPairs
                    ),
                }))
            ) as InfluxQueryResult<T, K>;
        },
        dropMeasurement: <K extends keyof T & string>(measurement: K) => {
            return influxDeleteApi.postDelete({
                org: config.org,
                bucket: config.bucket,
                body: {
                    start: new Date(0).toISOString(),
                    stop: new Date().toISOString(),
                    predicate: `_measurement="${measurement}"`,
                },
            });
        },
        _writeApi: influxWriteApi,
        _readApi: influxReadApi,
        _deleteApi: influxDeleteApi,
    };
};
