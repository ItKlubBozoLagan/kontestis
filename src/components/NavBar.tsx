import { FC } from "react";
import { FiMap } from "react-icons/all";
import tw from "twin.macro";

import NavElement, { NavItem } from "./NavElement";

const items: NavItem[] = [
    {
        display: "Dashboard",
        href: "dashboard",
        icon: "dashboard",
    },
    {
        display: "Contests",
        href: "contests",
        icon: "contests",
    },
    {
        display: "Problems",
        href: "problems",
        icon: "problems",
    },
    {
        display: "Account",
        href: "account",
        icon: "account",
    },
];

const userItems = ["My contests", "Host", "New problem"];

const NavBar: FC = () => {
    return (
        <div
            css={[
                tw`w-full p-4 pl-6 flex justify-start items-center gap-7 text-base`,
                tw`bg-slate-100`,
                tw`border-solid border-2 border-neutral-300`,
            ]}
        >
            <FiMap tw={"text-slate-600"} />
            {items.map((item) => (
                <NavElement item={item} key={item.href} />
            ))}
        </div>
    );
};

export default NavBar;
