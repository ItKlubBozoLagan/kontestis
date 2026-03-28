import { FC, useCallback } from "react";
import { FiClock, FiLogOut } from "react-icons/all";
import { Outlet } from "react-router";
import tw from "twin.macro";

import { NavElement } from "../../components/NavElement";
import { useAuthStore } from "../../state/auth";
import { useTokenStore } from "../../state/token";

export const TemporaryLayout: FC = () => {
    const { user } = useAuthStore();
    const { setToken } = useTokenStore();

    const logout = useCallback(() => {
        setToken("");
    }, [setToken]);

    return (
        <div tw={"w-full flex flex-col items-center"}>
            <div
                css={[
                    tw`w-full p-4 pl-6 flex flex-col sm:flex-row items-center justify-between gap-6 flex-wrap text-base`,
                    tw`bg-slate-100`,
                    tw`border-solid border-l-0 border-r-0 border-t-0 border-b-2 border-neutral-300`,
                ]}
            >
                <div tw={"flex gap-6 flex-col sm:flex-row items-center"}>
                    <span tw={"font-bold text-neutral-700"}>{user.full_name}</span>
                    <NavElement
                        item={{
                            display: "Contests",
                            href: "",
                            icon: FiClock,
                        }}
                    />
                </div>
                <div
                    tw={"flex items-center hover:text-red-800 transition-all cursor-pointer"}
                    onClick={logout}
                >
                    <FiLogOut size={"16px"} />
                </div>
            </div>
            <div
                tw={
                    "flex flex-col w-full max-w-[1000px] items-center justify-start gap-4 py-6 px-12"
                }
            >
                <Outlet />
            </div>
        </div>
    );
};
