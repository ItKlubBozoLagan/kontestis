import { ClientOptions, types } from "cassandra-driver";
import { fromScyllo } from "scyllo/lib/ScylloTranslator";

const ensureExistingCollections = (
    value: unknown,
    encodingOptions: ClientOptions["encoding"],
    columnType: types.dataTypes
) => {
    if (value !== null) return value;

    if (columnType === types.dataTypes.list) return [];

    if (columnType === types.dataTypes.set) {
        if (encodingOptions?.set?.prototype === Set.prototype) return new Set();

        return [];
    }

    if (columnType === types.dataTypes.map) {
        if (encodingOptions?.map?.prototype === Map.prototype) return new Map();

        return {};
    }

    return value;
};

export const fromObjectScyllo = (
    row: types.Row,
    encodingOptions: ClientOptions["encoding"],
    columns: types.ResultSet["columns"]
) =>
    Object.assign(
        {},
        ...row.keys().map((item: any) => ({
            [item]: ensureExistingCollections(
                fromScyllo(row.get(item)),
                encodingOptions,
                // could maybe use the index here, but not sure if they're ordered the same
                columns.find((it: any) => it.name === item)!.type.code
            ),
        }))
    );
