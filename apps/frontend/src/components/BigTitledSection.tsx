import React, { FC, ReactNode } from "react";

type Properties = {
    header: ReactNode;
    children: ReactNode;
};

export const BigTitledSection: FC<Properties> = React.forwardRef<
    HTMLDivElement,
    Properties & React.HTMLAttributes<HTMLDivElement>
>(({ header, children, className, ...properties }, reference) => {
    return (
        <div
            tw={"flex flex-col border-2 border-solid border-neutral-400 bg-neutral-200"}
            ref={reference}
            {...properties}
        >
            <div
                tw={
                    "w-full bg-neutral-100 p-2 text-xl flex gap-2 justify-start border border-solid border-neutral-300 border-t-0 border-r-0 border-l-0"
                }
            >
                <div tw={"flex gap-2 items-center"}>{header}</div>
            </div>
            <div tw={"flex flex-col items-center p-4"}>{children}</div>
        </div>
    );
});

BigTitledSection.displayName = "BigTitledSection";
