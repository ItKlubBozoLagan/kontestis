import { formatDuration as formatDurationMillis } from "@kontestis/utils";

// Contest times are always displayed in Croatian time, like the rest of Kontestis.
const dateTime = new Intl.DateTimeFormat("hr-HR", {
    timeZone: "Europe/Zagreb",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
});

const dateOnly = new Intl.DateTimeFormat("hr-HR", {
    timeZone: "Europe/Zagreb",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
});

export const formatDateTime = (date: Date) => dateTime.format(date);
export const formatDate = (date: Date) => dateOnly.format(date);

/** "3h 20m" style duration. */
export const formatDuration = (millis: number) => formatDurationMillis(Math.max(0, millis)) || "0s";

export const formatSeconds = (seconds: number) => formatDuration(seconds * 1000);

export const formatPercent = (value: number, digits = 0) => `${(value * 100).toFixed(digits)}%`;
