import { EloHistoryEntry } from "@kontestis/models";
import { Static } from "@sinclair/typebox";

import { RangeQueryUnion } from "../routes/stats/schemas";

type Range = Static<typeof RangeQueryUnion>;

export type EloStatistic = {
    time: Date;
    last: number;
};

const bucketStarts = (range: Range, now: Date): Date[] => {
    const count = range === "24h" ? 24 : range === "7d" ? 7 : range === "30d" ? 30 : 12;

    return Array.from({ length: count }, (_, index) => {
        if (range === "24h")
            return new Date(
                now.getFullYear(),
                now.getMonth(),
                now.getDate(),
                now.getHours() - index
            );

        if (range === "1y") return new Date(now.getFullYear(), now.getMonth() - index, 1);

        return new Date(now.getFullYear(), now.getMonth(), now.getDate() - index);
    });
};

export const reconstructEloStatistics = (
    currentElo: number,
    history: EloHistoryEntry[],
    range: Range,
    now = new Date()
): EloStatistic[] => {
    let rating = currentElo;
    const eventValues = [...history]
        .sort(
            (a, b) =>
                b.recorded_at.getTime() - a.recorded_at.getTime() ||
                b.event_id.localeCompare(a.event_id)
        )
        .map((event) => {
            const value = rating;

            rating -= event.delta;

            return { time: event.recorded_at, value };
        })
        .reverse();
    const baseline = rating;
    const starts = bucketStarts(range, now);

    return starts.map((start, index) => {
        const [previousStart] = starts.slice(Math.max(0, index - 1));
        const endExclusive = index === 0 ? now.getTime() + 1 : previousStart.getTime();
        let value = baseline;

        for (const event of eventValues) {
            if (event.time.getTime() >= endExclusive) break;

            const { value: eventValue } = event;

            value = eventValue;
        }

        return { time: start, last: value };
    });
};
