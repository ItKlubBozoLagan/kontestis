import type { Client, types } from "cassandra-driver";

import { fromObjectScyllo } from "../utils/scyllo_private";

/**
 * Stream large datasets from ScyllaDB to avoid memory issues.
 * This is useful for migrations and other operations that need to process large amounts of data.
 *
 * @param client - The Cassandra driver client instance
 * @param query - The CQL query to execute
 * @returns Promise that resolves to an array of parsed rows
 */
export async function streamQuery<T>(client: Client, query: string): Promise<T[]> {
    const results: T[] = [];

    // Get column metadata by running a LIMIT 1 query
    const metadataResult = await client.execute(`${query} LIMIT 1`);
    const { columns } = metadataResult;

    await new Promise<void>((resolve, reject) => {
        client
            .stream(query)
            .on("readable", function (this: any) {
                let row: types.Row;

                while ((row = this.read())) {
                    results.push(
                        fromObjectScyllo(
                            row,
                            {
                                useBigIntAsLong: true,
                            },
                            columns
                        ) as T
                    );
                }
            })
            .on("end", () => resolve())
            .on("error", (error: Error) => reject(error));
    });

    return results;
}
