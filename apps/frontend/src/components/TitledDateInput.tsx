import React from "react";
import tw from "twin.macro";

import { InputProperties } from "./TitledInput";

type Properties = {
    type: "date" | "datetime";
};

export const TitledDateInput = React.forwardRef<
    HTMLInputElement,
    React.InputHTMLAttributes<HTMLInputElement> & InputProperties & Properties
>(({ name, className, label, bigLabel, type, ...properties }, reference) => {
    return (
        <div tw={"w-full flex flex-col justify-start max-w-[256px]"} className={className}>
            {label && (
                <label id={name} tw={"pt-2 pb-1"} css={bigLabel ? tw`text-base` : tw`text-sm pl-1`}>
                    {label}
                </label>
            )}
            <input
                ref={reference}
                name={name}
                type={type === "date" ? "date" : "datetime-local"}
                tw={
                    "py-1 px-2 bg-neutral-200 border border-solid border-neutral-300 text-base outline-none hover:bg-neutral-300"
                }
                {...properties}
            />
        </div>
    );
});

TitledDateInput.displayName = "TitledDateInput";
