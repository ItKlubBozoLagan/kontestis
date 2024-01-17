import { FC, useMemo } from "react";
import { FiActivity, FiBarChart2, FiBell, FiMail, FiUser, FiUsers } from "react-icons/all";
import { Outlet } from "react-router";

import { PageTitle } from "../../components/PageTitle";
import { SubRouteNavBar } from "../../components/SubRouteNavBar";
import { useTranslation } from "../../hooks/useTranslation";

export const AdminPageLayout: FC = () => {
    const { t } = useTranslation();

    const SubRoutes = useMemo(
        () => [
            {
                display: t("admin.routes.overview"),
                href: "overview",
                icon: FiActivity,
            },
            {
                display: t("admin.routes.users"),
                href: "users",
                icon: FiUser,
            },
            {
                display: t("admin.routes.alerts"),
                href: "alerts",
                icon: FiBell,
            },
            {
                display: t("admin.routes.contests"),
                href: "contests",
                icon: FiBarChart2,
            },
            {
                display: t("admin.routes.organizations"),
                href: "organisations",
                icon: FiUsers,
            },
            {
                display: t("admin.routes.mail"),
                href: "mail",
                icon: FiMail,
            },
        ],
        [t]
    );

    return (
        <div tw={"w-full flex flex-col"}>
            <PageTitle>{t("admin.title")}</PageTitle>
            <SubRouteNavBar routes={SubRoutes} />
            <div tw={"w-full p-6 bg-neutral-100 flex items-center justify-between"}>
                <Outlet />
            </div>
        </div>
    );
};
