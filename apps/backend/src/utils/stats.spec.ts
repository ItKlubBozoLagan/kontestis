import { EloHistoryEntry } from "@kontestis/models";
import { describe, expect, it } from "vitest";

import { reconstructEloStatistics } from "./stats";

const entry = (
    eventId: string,
    recordedAt: Date,
    delta: number,
    resultingElo: number
): EloHistoryEntry => ({
    user_id: 1n,
    organisation_id: 1n,
    event_id: eventId,
    recorded_at: recordedAt,
    delta,
    resulting_elo: resultingElo,
    source: "contest",
});

describe("reconstructEloStatistics", () => {
    it("emits the established number of buckets for every API range", () => {
        const now = new Date(2026, 0, 3, 12);

        expect(reconstructEloStatistics(1000, [], "24h", now)).toHaveLength(24);
        expect(reconstructEloStatistics(1000, [], "7d", now)).toHaveLength(7);
        expect(reconstructEloStatistics(1000, [], "30d", now)).toHaveLength(30);
        expect(reconstructEloStatistics(1000, [], "1y", now)).toHaveLength(12);
    });

    it("returns a flat current rating when history is empty", () => {
        const now = new Date(2026, 0, 3, 12);
        const result = reconstructEloStatistics(1234, [], "7d", now);

        expect(result).toHaveLength(7);
        expect(result.every((statistic) => statistic.last === 1234)).toBe(true);
    });

    it("walks backward from the absolute current rating using deltas", () => {
        const now = new Date(2026, 0, 3, 12);
        const result = reconstructEloStatistics(
            1100,
            [entry("contest:1", new Date(2026, 0, 3, 10), 100, 1100)],
            "24h",
            now
        );

        expect(result).toHaveLength(24);
        expect(result.slice(0, 3).map((statistic) => statistic.last)).toEqual([1100, 1100, 1100]);
        expect(result[3].last).toBe(1000);
    });

    it("supports negative and reconciliation deltas without summing current ELO", () => {
        const now = new Date(2026, 0, 4, 12);
        const history = [
            entry("legacy:baseline", new Date(2026, 0, 1), 0, 1000),
            entry("legacy:reconciliation:v1", new Date(2026, 0, 2), 200, 1200),
            entry("contest:2", new Date(2026, 0, 3), -50, 1150),
        ];
        const result = reconstructEloStatistics(1150, history, "7d", now);

        expect(result[0].last).toBe(1150);
        expect(result.at(-1)?.last).toBe(1000);
    });
});
