import React from "react";
import tw from "twin.macro";

export type InputProperties = {
    label?: string;
    bigLabel?: boolean;
};

export const TitledInput = React.forwardRef<
    HTMLInputElement,
    React.InputHTMLAttributes<HTMLInputElement> & InputProperties
>(({ name, label, className, bigLabel, ...properties }, reference) => {
    return (
        <div tw={"w-full flex flex-col pt-2 justify-start max-w-[256px]"} className={className}>
            {label && (
                <label id={name} tw={"pb-1"} css={bigLabel ? tw`text-base` : tw`text-sm pl-1`}>
                    {label}
                </label>
            )}
            <input
                ref={reference}
                name={name}
                tw={
                    "py-1 px-2 bg-neutral-200 border border-solid border-neutral-300 text-base outline-none hover:bg-neutral-300"
                }
                {...properties}
            />
        </div>
    );
});

TitledInput.displayName = "TitledInput";
