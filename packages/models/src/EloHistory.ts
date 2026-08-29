import { Snowflake } from "./Snowflake";

export type EloHistorySource = "contest" | "legacy" | "reconciliation";

export type EloHistoryEntryV1 = {
    user_id: Snowflake;
    organisation_id: Snowflake;
    event_id: string;
    recorded_at: Date;
    contest_id?: Snowflake;
    delta: number;
    resulting_elo: number;
    source: EloHistorySource;
};

export type EloHistoryEntry = EloHistoryEntryV1;
