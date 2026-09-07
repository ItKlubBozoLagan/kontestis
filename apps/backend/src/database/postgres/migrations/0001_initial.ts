import { initialSchema } from "../schema";
import { defineSqlMigration } from "./types";

export const migrationInitial = defineSqlMigration({
    version: 1,
    name: "initial",
    sql: initialSchema,
});
