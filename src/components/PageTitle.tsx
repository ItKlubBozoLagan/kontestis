import React, { FC, ReactNode } from "react";

import { HeaderLine } from "./HeaderLine";

type Properties = {
    children: ReactNode;
};

const PageTitle: FC<Properties> = ({ children }) => {
    return (
        <div tw={"w-full flex flex-col py-10 text-neutral-700"}>
            <div tw={"text-4xl"}>{children}</div>
            <HeaderLine></HeaderLine>
        </div>
    );
};

export default PageTitle;
