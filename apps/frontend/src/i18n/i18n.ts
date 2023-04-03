import { DeepPartial, RecurringRecord } from "@kontestis/utils";

import type { I18nEn_Type } from "./languages/en";

// preferably don't change the default language
//  but if it's changed, make sure to also, change the type
export const I18N_DEFAULT_LANGUAGE = "en" as const;
type DefaultLanguageType = I18nEn_Type;

export const I18N_AVAILABLE_LANGUAGES = ["en", "hr"] as const;
export type I18N_POSSIBLE_LANGUAGES = (typeof I18N_AVAILABLE_LANGUAGES)[number];

type GenerifyStringProperties<T> = {
    [k in keyof T]: T[k] extends string ? string : GenerifyStringProperties<T[k]>;
};

export type LanguageSpec = RecurringRecord<string, string>;
export type DefaultLanguageSpec = DeepPartial<GenerifyStringProperties<DefaultLanguageType>>;

type ValueOf<T> = T[keyof T];

export type KeysFromSpec<
    T extends DeepPartial<LanguageSpec>,
    OnlyPlaceholder extends boolean = false
> = ValueOf<{
    [k in keyof T]: T[k] extends undefined
        ? never
        : k extends string
        ? T[k] extends DeepPartial<LanguageSpec>
            ? `${k}.${KeysFromSpec<T[k], OnlyPlaceholder>}`
            : OnlyPlaceholder extends true
            ? T[k] extends string
                ? PlaceholderArrayFromTemplate<T[k]>["length"] extends 0
                    ? never
                    : k
                : never
            : k
        : never;
}>;

type ValueFromKey<
    Spec extends DefaultLanguageSpec,
    Key extends I18NDefaultKeys | string
> = Key extends `${infer First}.${infer Rest}`
    ? First extends keyof Spec
        ? Spec[First] extends DeepPartial<LanguageSpec>
            ? ValueFromKey<Spec[First], Rest>
            : Spec[First]
        : never
    : Key extends keyof Spec
    ? Spec[Key]
    : never;

export type DefaultValueFromKey<Key extends I18NDefaultKeys> = ValueFromKey<
    DefaultLanguageType,
    Key
>;

// WebStorm parses the above insanity of a type wrong
//  and for some off reason, this fixes it
//  VS Code users are unaffected
type FixWebstormBug<T> = {
    [k in keyof T]: T[k];
};

export type I18NDefaultKeys = KeysFromSpec<DefaultLanguageType>;
export type I18NPlaceholderKeys = FixWebstormBug<KeysFromSpec<DefaultLanguageType, true>>;

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

export type PlaceholderTemplateReactChildren<
    Source extends string,
    Type,
    Parsed extends any[] = PlaceholderArrayFromTemplate<Source>,
    Filled extends Type[] = FillTuple<Parsed, Type>
> = Parsed extends [] ? undefined : Filled extends [Type] ? Filled[0] | Filled : Filled;

//
// Actual relevant logic
//

const loadedLanguages: Map<I18N_POSSIBLE_LANGUAGES, DefaultLanguageSpec> = new Map();

export const loadLanguage = async (language: I18N_POSSIBLE_LANGUAGES) => {
    if (loadedLanguages.has(language)) return;

    let languageSpec: DefaultLanguageSpec;

    try {
        languageSpec = await import(`./languages/${language}.ts`).then((loaded) => loaded.default);
    } catch {
        throw new Error(`unexpected translation error: "${language}" not found`);
    }

    loadedLanguages.set(language, languageSpec);
};

export const getLanguageResources = (language: I18N_POSSIBLE_LANGUAGES): DefaultLanguageSpec => {
    if (!loadedLanguages.has(language)) throw new Error(`language "${language}" not loaded`);

    return loadedLanguages.get(language)!;
};

const languageKeyCache: Map<I18N_POSSIBLE_LANGUAGES, Map<I18NDefaultKeys, string>> = new Map();

for (const language of I18N_AVAILABLE_LANGUAGES) languageKeyCache.set(language, new Map());

export const translationValueFromKey = (
    language: I18N_POSSIBLE_LANGUAGES,
    key: I18NDefaultKeys
): string => {
    if (languageKeyCache.get(language)!.has(key)) return languageKeyCache.get(language)!.get(key)!;

    const keyParts = key.split(".");

    if (!loadedLanguages.get(language)) throw new Error(`language "${language}" not loaded`);

    // any is relatively safe here
    let currentValue: any = loadedLanguages.get(language);

    for (const part of keyParts) {
        if (!(part in currentValue)) {
            if (language !== I18N_DEFAULT_LANGUAGE)
                return translationValueFromKey(I18N_DEFAULT_LANGUAGE, key);

            // default keys should only allow keys actually present in the translations
            //   realistically we never hit this
            throw new Error(
                `unexpected translation error: incomplete default language ${I18N_DEFAULT_LANGUAGE}`
            );
        }

        currentValue = currentValue[part];
    }

    const returnValue = currentValue as string;

    languageKeyCache.get(language)!.set(key, returnValue);

    return returnValue;
};
