export type ProblemStatus = "unattempted" | "zero" | "partial" | "full";

/** How far the viewer got on a problem; `undefined` means they never scored a submission. */
export const problemStatus = (score: number | undefined, max: number): ProblemStatus => {
    if (score === undefined) return "unattempted";

    if (score <= 0) return "zero";

    return score >= max ? "full" : "partial";
};

/** "A", "B", … "Z", "AA", … for the n-th problem of a contest. */
export const problemLetter = (index: number): string =>
    (index >= 26 ? problemLetter(Math.floor(index / 26) - 1) : "") +
    String.fromCodePoint(65 + (index % 26));

export const statusChip: Record<ProblemStatus, string> = {
    unattempted: "border-border bg-card text-foreground",
    zero: "border-red-300 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/60 dark:text-red-300",
    partial:
        "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-200",
    full: "border-green-400 bg-green-100 text-green-900 dark:border-green-800 dark:bg-green-950/70 dark:text-green-200",
};

export const statusBar: Record<ProblemStatus, string> = {
    unattempted: "bg-transparent",
    zero: "bg-red-400",
    partial: "bg-amber-400",
    full: "bg-green-500",
};
