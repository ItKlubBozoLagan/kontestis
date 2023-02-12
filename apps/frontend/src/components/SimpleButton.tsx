import { ButtonHTMLAttributes, FC } from "react";
import { IconType } from "react-icons";
import tw from "twin.macro";

type Properties = {
    prependIcon?: IconType;
};

export const SimpleButton: FC<ButtonHTMLAttributes<HTMLButtonElement> & Properties> = ({
    children,
    prependIcon: PrependIcon,
    ...properties
}) => {
    return (
        <button
            css={[
                tw`w-auto bg-neutral-300 text-black font-mono px-2 py-1 cursor-pointer h-[max-content]`,
                tw`border border-neutral-500 hover:bg-neutral-400/70 active:(bg-neutral-400/80 pt-1.5 pb-0.5)`,
                tw`flex gap-1 items-center`,
            ]}
            {...properties}
        >
            {PrependIcon && <PrependIcon size={14} />}
            {children}
        </button>
    );
};
