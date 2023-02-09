import React, { FC, InputHTMLAttributes } from "react";

export const TitledInput: FC<InputHTMLAttributes<HTMLInputElement>> = ({
    name,
    ...properties
}) => {
    return (
        <div tw={"w-full flex flex-col justify-start pt-2 max-w-[256px]"}>
            <label id={name} tw={"text-sm pl-1 pb-1"}>
                {name}
            </label>
            <input
                name={name}
                tw={
                    "py-1 px-2 bg-neutral-200 border border-solid border-neutral-300 text-base outline-none hover:bg-neutral-300"
                }
                {...properties}
            />
        </div>
    );
};
