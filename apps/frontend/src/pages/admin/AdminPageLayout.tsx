import { FC } from "react";
import { FiActivity, FiBarChart2, FiBell, FiUsers } from "react-icons/all";
import { Outlet } from "react-router";

import { NavItem } from "../../components/NavElement";
import { PageTitle } from "../../components/PageTitle";
import { SubRouteNavBar } from "../../components/SubRouteNavBar";

const SubRoutes: NavItem[] = [
    {
        display: "Overview",
        href: "overview",
        icon: FiActivity,
    },
    {
        display: "Users",
        href: "users",
        icon: FiUsers,
    },
    {
        display: "Alerts",
        href: "alerts",
        icon: FiBell,
    },
    {
        display: "Contests",
        href: "contests",
        icon: FiBarChart2,
    },
];

export const AdminPageLayout: FC = () => {
    return (
        <div tw={"w-full flex flex-col"}>
            <PageTitle>Admin page</PageTitle>
            <SubRouteNavBar routes={SubRoutes} />
            <div tw={"w-full p-6 bg-neutral-100 flex items-center justify-between"}>
                <Outlet />
            </div>
        </div>
    );
};
