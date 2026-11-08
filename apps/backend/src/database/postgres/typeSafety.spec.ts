/* eslint-env jest */

import { User } from "@kontestis/models";

import { inArray } from "./criteria";
import { PostgresDatabase } from "./PostgresDatabase";

const compileTimeContracts = (database: PostgresDatabase) => {
    const completeRows: Promise<User[]> = database.selectFrom("users", "*", { id: 1n });
    const emailRows: Promise<Pick<User, "email">[]> = database.selectFrom("users", ["email"], {
        id: inArray(1n, 2n),
    });

    emailRows.then(([row]) => {
        const { email } = row;

        // @ts-expect-error The projection intentionally does not include id.
        const { id } = row;

        return { email, id };
    });

    // @ts-expect-error User ids are bigint, not strings.
    database.selectFrom("users", "*", { id: "1" });

    // @ts-expect-error IN values must match the selected column's type.
    database.selectFrom("users", "*", { id: inArray("1", "2") });

    // @ts-expect-error Unknown columns cannot be selected.
    database.selectFrom("users", ["unknown_column"]);

    const aggregate = database.raw<{ count: bigint }>("SELECT COUNT(*)::bigint AS count");

    return { aggregate, completeRows, emailRows };
};

describe("PostgreSQL compile-time contracts", () => {
    it("keeps the strict contracts in the TypeScript compilation", () => {
        expect(compileTimeContracts).toBeDefined();
    });
});
