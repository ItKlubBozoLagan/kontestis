import { migrationInitial } from "./0001_initial";
import { PostgresMigration } from "./types";

export const postgresMigrations: readonly PostgresMigration[] = [migrationInitial];
