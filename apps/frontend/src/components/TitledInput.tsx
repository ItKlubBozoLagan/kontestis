import React, { FC, InputHTMLAttributes } from "react";

export const TitledInput: FC<InputHTMLAttributes<HTMLInputElement>> = ({
    name,
    ...properties
}) => {
    return (
        <div
            tw={
                "w-full flex flex-col justify-start relative pt-4 max-w-[256px]"
            }
        >
            <label
                id={name}
                tw={
                    "absolute text-sm right-2 bg-neutral-200 px-1 border border-solid border-neutral-300 select-none"
                }
                style={{
                    transform: "translateY(-40%)",
                }}
            >
                {name}
            </label>
            <input
                name={name}
                tw={
                    "py-1 px-2 bg-neutral-200 border border-solid border-neutral-300 text-base outline-none focus:bg-neutral-300"
                }
                {...properties}
            />
        </div>
    );
};
