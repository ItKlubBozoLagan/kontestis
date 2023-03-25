import React, { FC, ReactNode } from "react";

import { HeaderLine } from "./HeaderLine";

type Properties = {
    children: ReactNode;
};

export const PageTitle: FC<Properties> = ({ children }) => {
    return (
        <div tw={"w-full flex flex-col py-10 text-neutral-700"}>
            <div tw={"text-3xl flex gap-4 justify-between items-center"}>{children}</div>
            <HeaderLine></HeaderLine>
        </div>
    );
};
