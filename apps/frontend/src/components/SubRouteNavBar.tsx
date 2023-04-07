import { FC } from "react";
import { useLocation } from "react-router";
import { Link } from "react-router-dom";

import { NavItem } from "./NavElement";

type Properties = {
    routes: NavItem[];
};

export const SubRouteNavBar: FC<Properties> = ({ routes }) => {
    const current = useLocation();

    return (
        <div tw={"flex w-full bg-neutral-200"}>
            {routes.map(({ icon: Icon, ...route }) => (
                <Link to={route.href} key={route.href} tw={"w-full"}>
                    <div
                        tw={
                            "flex items-center w-full bg-neutral-200 hover:bg-neutral-300 cursor-pointer p-3 relative gap-2"
                        }
                    >
                        <Icon size={"16px"} />
                        <span>
                            {route.display}
                            {current.pathname.endsWith(route.href) && (
                                <span
                                    tw={"absolute w-full h-0.5 bg-neutral-600 left-0 bottom-0"}
                                ></span>
                            )}
                        </span>
                    </div>
                </Link>
            ))}
        </div>
    );
};
