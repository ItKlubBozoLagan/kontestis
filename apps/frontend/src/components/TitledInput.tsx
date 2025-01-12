/* eslint-disable jsx-a11y/no-autofocus */
import React from "react";
import tw from "twin.macro";

export type InputProperties = {
    label?: string;
    bigLabel?: boolean;
    error?: string;
    // a kind of wrapper around autoFocus, but makes eslint not yell
    focusOnLoad?: boolean;
};

export const TitledInput = React.forwardRef<
    HTMLInputElement,
    React.InputHTMLAttributes<HTMLInputElement> & InputProperties
>(({ name, label, className, bigLabel, error, focusOnLoad, ...properties }, reference) => {
    return (
        <div tw={"w-full flex flex-col gap-1 justify-start max-w-[256px]"} className={className}>
            {label && (
                <label id={name} css={bigLabel ? tw`text-base` : tw`text-sm pl-1`}>
                    {label}
                </label>
            )}
            <input
                ref={reference}
                name={name}
                autoFocus={focusOnLoad}
                tw={
                    "py-1 px-2 bg-neutral-200 border border-solid border-neutral-300 text-base outline-none hover:bg-neutral-300"
                }
                {...properties}
            />
            {error && <span tw={"text-red-600"}>{error}</span>}
        </div>
    );
});

TitledInput.displayName = "TitledInput";
