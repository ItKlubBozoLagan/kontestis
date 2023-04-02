import React, { ReactElement, useMemo } from "react";

import { useLanguageContext } from "../context/useLanguageContext";
import {
    DefaultValueFromKey,
    I18NDefaultKeys,
    PlaceholderTemplateReactChildren,
    translationValueFromKey,
} from "../i18n/i18n";

type TranslationReactComponent = ReactElement | string | number;

type Properties<
    Key extends I18NDefaultKeys,
    Children extends PlaceholderTemplateReactChildren<
        DefaultValueFromKey<Key>,
        TranslationReactComponent
    > = PlaceholderTemplateReactChildren<DefaultValueFromKey<Key>, TranslationReactComponent>
> = {
    translationKey: Key;
} & (undefined extends Children ? { children?: undefined } : { children: Children });

const TranslatedRoot = <TK extends I18NDefaultKeys>({
    translationKey,
    children,
}: Properties<TK>) => {
    const { currentLanguage } = useLanguageContext();

    const childArray = useMemo(() => React.Children.toArray(children), [children]);

    return useMemo(() => {
        const raw = translationValueFromKey(currentLanguage, translationKey);

        const components: TranslationReactComponent[] = [];
        let current = "";

        for (let index = 0; index < raw.length; index++) {
            current += raw[index];

            if (raw.length >= index + 3 && /[^\\]%\d/.test(raw.slice(index, index + 3))) {
                components.push(current);
                const childIndex = +raw[index + 2] - 1;

                if (childArray.length <= childIndex) {
                    const childCount = React.Children.count(children);

                    // types will ensure correct amount of children
                    throw new Error(
                        `unexpected translation error: possibly wrongly formatted placeholder string, placeholder should be one of ${Array.from(
                            { length: childCount },
                            (_, elementIndex) => elementIndex + 1
                        ).join(", ")}`
                    );
                }

                // props will validate this
                components.push(childArray[childIndex] as TranslationReactComponent, " ");
                current = "";
                index += 2;
            }
        }

        if (current) components.push(current);

        return (
            <span>
                {components.map((component, index) => (
                    <React.Fragment key={`${translationKey}-${index}`}>{component}</React.Fragment>
                ))}
            </span>
        );
        // check how many, generate array normally, verify actual values
    }, [currentLanguage, children]);
};

export const Translated = React.memo(TranslatedRoot) as typeof TranslatedRoot;
