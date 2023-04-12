import { FC, ReactNode } from "react";

type Properties = {
    title: string;
    children: ReactNode;
};

export const MetricsInfoBox: FC<Properties> = ({ title, children }) => {
    return (
        <div
            tw={
                "w-full h-fit text-lg flex flex-col gap-2 bg-neutral-100 border border-solid border-neutral-400 p-2"
            }
        >
            <span tw={"font-bold"}>{title}</span>
            <div>{children}</div>
        </div>
    );
};
