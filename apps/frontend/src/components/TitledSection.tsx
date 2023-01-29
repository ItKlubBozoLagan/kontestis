import { FC, ReactNode } from "react";

type Properties = {
    title: string;
    children: ReactNode;
};

export const TitledSection: FC<Properties> = ({ title, children }) => {
    return (
        <div
            tw={
                "w-full flex flex-col items-center border-solid border-2 border-neutral-200"
            }
        >
            <div
                tw={
                    "w-full text-neutral-800 text-lg bg-neutral-100 text-center py-1"
                }
            >
                {title}
            </div>
            <div tw={"w-full h-full flex flex-col items-center gap-2 p-4"}>
                {children}
            </div>
        </div>
    );
};
