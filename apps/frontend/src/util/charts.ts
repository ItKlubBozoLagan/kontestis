import { ChartDateFormatFunction } from "../components/HistoryLineChart";
import { CountStatRange } from "../hooks/stats/types";

const splitAndIndex = (source: string, index: number, spliterator: string = ",") =>
    source.split(spliterator)[index];

export const RangeFormatters: Record<CountStatRange, ChartDateFormatFunction> = {
    "24h": (date, index) => `${date.getHours()}:00`,
    "7d": (date, _, t) => splitAndIndex(t("helper.shortWeekDayNames"), date.getDay()),
    "30d": (date, _, t) =>
        `${date.getDate() + 1}. ${splitAndIndex(t("helper.shortMonthNames"), date.getMonth())}`,
    "1y": (date, _, t) =>
        `${splitAndIndex(t("helper.shortMonthNames"), date.getMonth())}. ${date.getFullYear()}.`,
};
