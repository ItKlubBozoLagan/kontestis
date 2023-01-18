import { ButtonHTMLAttributes, FC, ReactNode } from "react";

type Properties = {
    children: ReactNode;
};

export const SimpleButton: FC<ButtonHTMLAttributes<HTMLButtonElement>> = ({
    children,
    ...properties
}) => {
    return (
        <button
            tw={
                "w-auto bg-red-300 text-neutral-800 border-neutral-500 font-mono border-[1px] hover:(bg-red-400 text-neutral-900) rounded-md py-1.5"
            }
            {...properties}
        >
            {children}
        </button>
    );
};
