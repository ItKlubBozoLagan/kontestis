import { FC, ReactNode } from "react";

type Properties = {
    title: string;
    children: ReactNode;
};

export const TitledSection: FC<Properties> = ({ title, children }) => {
    return (
        <div
            tw={
                "w-full flex flex-col justify-start border-solid border-2 border-neutral-200 rounded-md"
            }
        >
            <div
                tw={
                    "w-full text-neutral-800 text-lg bg-neutral-100 text-center py-1"
                }
            >
                {title}
            </div>
            <div
                tw={
                    "w-full flex flex-col justify-start gap-2 text-neutral-600 text-sm p-2 box-border"
                }
            >
                {children}
            </div>
        </div>
    );
};
