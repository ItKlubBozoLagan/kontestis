import { FC } from "react";
import {FiAlignCenter, FiClock, FiCpu, FiLayers, FiUser} from "react-icons/all";

export type NavItem = {
    display: string,
    href: string,
    icon: "dashboard" | "contests" | "problems" | "account"
}

const icons = {
    dashboard: <FiCpu/>,
    contests: <FiClock/>,
    problems: <FiLayers/>,
    account: <FiUser/>
}

type Props = {
    item: NavItem
}

const NavElement: FC<Props> = ({ item }) => {
    const link = "./" + item.href;
    return (
        <div tw={"flex justify-start gap-1 items-center no-underline font-bold text-neutral-500 hover:(text-sky-800 cursor-pointer) transition-all"}>
            {icons[item.icon]}
            <div>{item.display}</div>
        </div>
    )
}

export default NavElement
