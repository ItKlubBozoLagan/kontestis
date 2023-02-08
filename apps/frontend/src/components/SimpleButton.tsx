import { ButtonHTMLAttributes, FC } from "react";

export const SimpleButton: FC<ButtonHTMLAttributes<HTMLButtonElement>> = ({
    children,
    ...properties
}) => {
    return (
        <button
            tw={
                "w-auto bg-red-300 text-neutral-800 border-neutral-500 font-mono border hover:(bg-red-400 text-neutral-900) p-1.5 cursor-pointer"
            }
            {...properties}
        >
            {children}
        </button>
    );
};
