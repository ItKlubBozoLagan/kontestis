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
                <div
                    tw={
                        "flex flex-col w-full max-w-[1000px] items-center justify-start gap-4 py-6 px-12"
                    }
                >
                    <Outlet />
                </div>
            }
        </div>
    );
};
