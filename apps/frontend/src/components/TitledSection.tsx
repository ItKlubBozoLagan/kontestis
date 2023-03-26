import { CSSProperties, FC, ReactNode } from "react";

type Properties = {
    className?: string;
    parentStyle?: CSSProperties;
    small?: boolean;
    title: string;
    children: ReactNode;
};

export const TitledSection: FC<Properties> = ({
    className,
    parentStyle,
    small,
    title,
    children,
}) => {
    return (
        <div
            tw={"w-full flex flex-col items-center border-solid border-2 border-neutral-200"}
            css={small ? { width: "min-content" } : ""}
            style={parentStyle}
        >
            <div tw={"w-full text-neutral-800 text-lg bg-neutral-100 text-center py-1"}>
                {title}
            </div>
            <div
                tw={"w-full h-full flex flex-col items-center gap-2 p-4 bg-white"}
                className={className}
            >
                {children}
            </div>
        </div>
    );
};
