import { R } from "./remeda";

type CountRange = "24h" | "7d" | "30d" | "1y";

type StatCount = {
    time: Date;
    count: number;
};

const fillUp = (
    source: StatCount[],
    elements: number,
    dateGenerator: (index: number) => Date,
    dateComparator: (a: Date, b: Date) => boolean
) => {
    const raw = Array.from({ length: 24 }, (_, index) => ({
        time: dateGenerator(index),
        count: 0,
    })).concat(source);

    return R.uniqWith(
        raw.filter((stat) =>
            raw
                .filter((it) => dateComparator(stat.time, it.time))
                .every((it) => it.count <= stat.count)
        ),
        (a, b) => dateComparator(a.time, b.time) && a.count === b.count
    ).slice(0, 24);
};

export const fitCountStatToRange = (source: StatCount[], range: CountRange) => {
    const baseDate = R.maxBy(source, (it) => it.time.getTime())?.time ?? new Date();

    switch (range) {
        case "24h":
            return fillUp(
                source,
                24,
                (index) =>
                    new Date(
                        baseDate.getFullYear(),
                        baseDate.getMonth(),
                        baseDate.getDate(),
                        baseDate.getHours() - index
                    ),
                (a, b) =>
                    Math.trunc(a.getTime() / 1000 / 60 / 60) ===
                    Math.trunc(b.getTime() / 1000 / 60 / 60)
            );
        case "7d":
        case "30d":
            return fillUp(
                source,
                range === "7d" ? 7 : 30,
                (index) =>
                    new Date(
                        baseDate.getFullYear(),
                        baseDate.getMonth(),
                        baseDate.getDate() - index
                    ),
                (a, b) =>
                    Math.trunc(a.getTime() / 1000 / 60 / 60 / 24) ===
                    Math.trunc(b.getTime() / 1000 / 60 / 60 / 24)
            );
        case "1y":
            return fillUp(
                source,
                12,
                (index) => new Date(baseDate.getFullYear(), baseDate.getMonth() - index),
                (a, b) =>
                    Math.trunc(a.getTime() / 1000 / 60 / 60 / 24 / 30) ===
                    Math.trunc(b.getTime() / 1000 / 60 / 60 / 24 / 30)
            );
    }
};
