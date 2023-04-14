import React, { CSSProperties, FC, ReactNode } from "react";

type Properties = {
    className?: string;
    parentStyle?: CSSProperties;
    small?: boolean;
    title: string;
    children: ReactNode;
};

export const TitledSection: FC<Properties> = React.forwardRef<
    HTMLDivElement,
    Properties & React.HTMLAttributes<HTMLDivElement>
>(({ parentStyle, small, title, children, ...properties }, reference) => {
    return (
        <div
            tw={"w-full flex flex-col items-center border-solid border-2 border-neutral-300"}
            css={small ? { width: "min-content" } : ""}
            style={parentStyle}
        >
            <div tw={"w-full text-neutral-800 text-lg bg-neutral-100 text-center py-1"}>
                {title}
            </div>
            <div
                tw={"w-full h-full flex flex-col items-center gap-2 p-4 bg-white"}
                ref={reference}
                {...properties}
            >
                {children}
            </div>
        </div>
    );
});

TitledSection.displayName = "TitledSection";
