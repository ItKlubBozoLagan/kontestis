import { FC } from "react";
import tw, { TwStyle } from "twin.macro";

type Properties = {
    size: "xs" | "s" | "base" | "lg" | "xl";
};

const sizeTwMap: Record<Properties["size"], TwStyle> = {
    xs: tw`h-6 w-6 border-2`,
    s: tw`h-12 w-12 border-2`,
    base: tw`h-16 w-16 border-4`,
    lg: tw`h-20 w-20 border-4`,
    xl: tw`h-24 w-24 border-4`,
};

export const LoadingSpinner: FC<Properties> = ({ size }) => {
    return (
        <div
            tw={
                "border-solid border-neutral-800 border-r-neutral-400 border-b-neutral-400 border-l-neutral-400 rounded-full animate-spin"
            }
            css={sizeTwMap[size]}
        ></div>
    );
};
