import md5 from "md5";
import { FC } from "react";
import { FiLogOut } from "react-icons/all";
import tw from "twin.macro";

import { useAuthStore } from "../state/auth";
import NavElement, { NavItem } from "./NavElement";

const items: NavItem[] = [
    {
        display: "Dashboard",
        href: "",
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

const NavBar: FC = () => {
    const { isLoggedIn, user, setToken } = useAuthStore();

    return (
        <div
            css={[
                tw`w-full p-4 pl-6 flex flex-col sm:flex-row items-center justify-between items-center gap-6 text-sm flex-wrap md:text-base`,
                tw`bg-slate-100`,
                tw`border-solid border-l-0 border-r-0 border-t-0 border-b-2 border-neutral-300`,
            ]}
        >
            <div tw={"flex gap-6 flex-col sm:flex-row items-center"}>
                {isLoggedIn && (
                    <img
                        tw={"w-8 h-auto rounded-full"}
                        src={`https://www.gravatar.com/avatar/${md5(
                            user.email.trim().toLowerCase()
                        )}`}
                        alt={"Profile avatar"}
                    />
                )}
                {items.map((item) => (
                    <NavElement item={item} key={item.href} />
                ))}
            </div>
            {isLoggedIn && (
                <div>
                    <div
                        tw={
                            "flex items-center hover:text-red-800 transition-all cursor-pointer"
                        }
                        onClick={() => setToken("")}
                    >
                        <FiLogOut size={"16px"} />
                    </div>
                </div>
            )}
        </div>
    );
};

export default NavBar;
