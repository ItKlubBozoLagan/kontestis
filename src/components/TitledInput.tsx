import React, { FC, InputHTMLAttributes } from "react";

type Properties = {
    title: string;
};

export const TitledInput: FC<InputHTMLAttributes<HTMLInputElement>> = ({
    title,
    ...properties
}) => {
    return (
        <div tw={"w-full flex flex-col justify-start p-1"}>
            <div tw={"font-mono text-lg text-neutral-700"}>{title}</div>
            <div tw={"w-full flex justify-center"}>
                <input
                    tw={
                        "w-[90%] py-1 border-neutral-300 bg-neutral-200 border-solid rounded-sm"
                    }
                    {...properties}
                />
            </div>
        </div>
    );
};
