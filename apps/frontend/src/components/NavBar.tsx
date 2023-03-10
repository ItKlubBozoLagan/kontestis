import { FC } from "react";
import { FiClock, FiCpu, FiLayers, FiLogOut, FiSettings, FiUser } from "react-icons/all";
import tw from "twin.macro";

import { useAuthStore } from "../state/auth";
import { useTokenStore } from "../state/token";
import { NavElement, NavItem } from "./NavElement";

const items: NavItem[] = [
    {
        display: "Dashboard",
        href: "",
        icon: FiCpu,
    },
    {
        display: "Contests",
        href: "contests",
        icon: FiClock,
    },
    {
        display: "Problems",
        href: "problems",
        icon: FiLayers,
    },
    {
        display: "Account",
        href: "account",
        icon: FiUser,
    },
];

export const NavBar: FC = () => {
    const { user } = useAuthStore();
    const { setToken } = useTokenStore();

    return (
        <div
            css={[
                tw`w-full p-4 pl-6 flex flex-col sm:flex-row items-center justify-between items-center gap-6 flex-wrap text-base`,
                tw`bg-slate-100`,
                tw`border-solid border-l-0 border-r-0 border-t-0 border-b-2 border-neutral-300`,
            ]}
        >
            <div tw={"flex gap-6 flex-col sm:flex-row items-center"}>
                <img
                    tw={"w-8 h-auto rounded-full"}
                    src={user.picture_url}
                    alt={"Profile avatar"}
                    referrerPolicy={"no-referrer"}
                />
                <div tw={"flex flex-wrap justify-center gap-6"}>
                    {items.map((item) => (
                        <NavElement item={item} key={item.href} />
                    ))}
                </div>
            </div>
            <div tw={"flex gap-6 flex-col sm:flex-row items-center"}>
                <NavElement
                    item={{
                        display: "Management",
                        href: "management",
                        icon: FiSettings,
                    }}
                />
                <div
                    tw={"flex items-center hover:text-red-800 transition-all cursor-pointer"}
                    onClick={() => setToken("")}
                >
                    <FiLogOut size={"16px"} />
                </div>
            </div>
        </div>
    );
};
