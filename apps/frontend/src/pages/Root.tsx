import { FC } from "react";
import { Outlet } from "react-router";

import { NavBar } from "../components/NavBar";

type Properties = {
    hideNavbar?: boolean;
};

export const Root: FC<Properties> = ({ hideNavbar = false }) => {
    return (
        <div tw={"w-full flex flex-col items-center"}>
            {!hideNavbar && <NavBar />}
            {
                <div tw={"flex flex-col w-1/2 max-w-[900px] items-center justify-start gap-5 py-6"}>
                    <Outlet />
                </div>
            }
        </div>
    );
};
