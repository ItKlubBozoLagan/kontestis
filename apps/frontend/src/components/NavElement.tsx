import { FC } from "react";
import { IconType } from "react-icons";
import { Link } from "react-router-dom";

export type NavItem = {
    display: string;
    href: string;
    icon: IconType;
};

type Properties = {
    item: NavItem;
};

export const NavElement: FC<Properties> = ({ item: { icon: Icon, ...item } }) => {
    return (
        <Link tw={"flex items-center"} to={`./${item.href}`}>
            <div
                tw={
                    "flex justify-start gap-2 items-center no-underline font-bold text-neutral-500 hover:(text-sky-800 cursor-pointer) transition-all"
                }
            >
                <Icon />
                <div>{item.display}</div>
            </div>
        </Link>
    );
};
