import { FC } from "react";
import { FiClock, FiCpu, FiLayers, FiUser } from "react-icons/all";
import { Link } from "react-router-dom";

export type NavItem = {
    display: string;
    href: string;
    icon: "dashboard" | "contests" | "problems" | "account";
};

const icons = {
    dashboard: <FiCpu />,
    contests: <FiClock />,
    problems: <FiLayers />,
    account: <FiUser />,
};

type Properties = {
    item: NavItem;
};

export const NavElement: FC<Properties> = ({ item }) => {
    return (
        <Link tw={"flex items-center"} to={`./${item.href}`}>
            <div
                tw={
                    "flex justify-start gap-2 items-center no-underline font-bold text-neutral-500 hover:(text-sky-800 cursor-pointer) transition-all"
                }
            >
                {icons[item.icon]}
                <div>{item.display}</div>
            </div>
        </Link>
    );
};
