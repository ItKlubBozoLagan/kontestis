import { RecurringRecord } from "@kontestis/utils";

import type { I18nEn_Type } from "./languages/en";

export const I18N_DEFAULT_LANGUAGE = "en" as const;
export const I18N_AVAILABLE_LANGUAGES = ["en", "hr"] as const;

type GenerifyStringProperties<T> = {
    [k in keyof T]: T[k] extends string ? string : GenerifyStringProperties<T[k]>;
};

type DeepSpecUndefined<T extends LanguageSpec> = {
    [k in keyof T]?: T[k] extends LanguageSpec ? DeepSpecUndefined<T[k]> : T[k];
};

export type LanguageSpec = RecurringRecord<string, string>;
export type DefaultLanguageSpec = DeepSpecUndefined<GenerifyStringProperties<I18nEn_Type>>;

type ValueOf<T> = T[keyof T];

export type KeysFromSpec<T extends DeepSpecUndefined<LanguageSpec>> = ValueOf<{
    [k in keyof T]: T[k] extends undefined
        ? never
        : k extends string
        ? T[k] extends DeepSpecUndefined<LanguageSpec>
            ? `${k}.${KeysFromSpec<T[k]>}`
            : k
        : never;
}>;

type FillTuple<Source extends readonly any[], Type> = Source extends [infer _, ...infer Rest]
    ? [Type, ...FillTuple<Rest, Type>]
    : [];

// TODO: support multi-digit placeholders
type PlaceholderArrayFromTemplate<Source extends string> =
    Source extends `${infer First}%${infer NumberPart extends number}${infer Rest}`
        ? First extends `${string}\\`
            ? PlaceholderArrayFromTemplate<Rest>
            : NumberPart extends PlaceholderArrayFromTemplate<Rest>[number]
            ? PlaceholderArrayFromTemplate<Rest>
            : [NumberPart, ...PlaceholderArrayFromTemplate<Rest>]
        : Source extends `${string}%${infer Rest}`
        ? PlaceholderArrayFromTemplate<Rest>
        : [];

export type PlaceholderTemplateChildren<
    Source extends string,
    Type,
    Parsed extends any[] = PlaceholderArrayFromTemplate<Source>,
    Filled extends Type[] = FillTuple<Parsed, Type>
> = Parsed["length"] extends 0
    ? undefined
    : Parsed["length"] extends 1
    ? Filled[0] | Filled
    : Filled;
