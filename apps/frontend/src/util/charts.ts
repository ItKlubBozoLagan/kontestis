import { StatisticRange } from "../hooks/stats/types";
import { I18NTextKeys, TranslationFunction } from "../i18n/i18n";

type ChartDateFormatFunction = (
    date: Date,
    index: number,
    translation: TranslationFunction<I18NTextKeys>
) => string;

const splitAndIndex = (source: string, index: number, spliterator: string = ",") =>
    source.split(spliterator)[index];

export const RangeFormatters: Record<StatisticRange, ChartDateFormatFunction> = {
    "24h": (date) => `${date.getHours()}:00`,
    "7d": (date, _, t) => splitAndIndex(t("helper.shortWeekDayNames"), date.getDay()),
    "30d": (date, _, t) =>
        `${date.getDate() + 1}. ${splitAndIndex(t("helper.shortMonthNames"), date.getMonth())}`,
    "1y": (date, _, t) =>
        `${splitAndIndex(t("helper.shortMonthNames"), date.getMonth())}. ${date.getFullYear()}.`,
};
