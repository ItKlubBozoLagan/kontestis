import { FC } from "react";
import { Outlet } from "react-router";

import NavBar from "../components/NavBar";

export const Root: FC = () => {
    return (
        <div tw={"w-full flex flex-col items-center"}>
            <NavBar />
            {
                <div
                    tw={
                        "flex flex-col w-1/2 max-w-[800px] items-center justify-start gap-y-5"
                    }
                >
                    <Outlet />
                </div>
            }
        </div>
    );
};