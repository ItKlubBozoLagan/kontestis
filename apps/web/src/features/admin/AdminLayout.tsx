import { Activity, BarChart3, Bell, Building2, Mail, ShieldAlert, Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import { NavLink, Outlet } from "react-router";

import { useCurrentUser } from "@/api/auth";
import { AsyncBoundary } from "@/components/common/AsyncBoundary";
import { EmptyState } from "@/components/common/EmptyState";
import { PageHeader } from "@/components/common/PageHeader";
import { isAdmin } from "@/lib/permissions";
import { cn } from "@/lib/utils";

export const AdminLayout = () => {
    const { t } = useTranslation();
    const user = useCurrentUser();

    if (!isAdmin(user))
        return (
            <EmptyState
                icon={ShieldAlert}
                title={t("errors.forbidden")}
                description={t("admin.forbidden")}
            />
        );

    const tabs = [
        { to: "overview", label: t("admin.routes.overview"), icon: Activity },
        { to: "users", label: t("admin.routes.users"), icon: Users },
        { to: "alerts", label: t("admin.routes.alerts"), icon: Bell },
        { to: "contests", label: t("admin.routes.contests"), icon: BarChart3 },
        { to: "organisations", label: t("admin.routes.organisations"), icon: Building2 },
        { to: "mail", label: t("admin.routes.mail"), icon: Mail },
    ];

    return (
        <div className="flex w-full flex-col gap-6">
            <PageHeader title={t("admin.title")} description={t("admin.description")} />
            <nav className="bg-muted/70 flex flex-wrap gap-1 overflow-x-auto rounded-md border p-1">
                {tabs.map((tab) => (
                    <NavLink
                        key={tab.to}
                        to={tab.to}
                        className={({ isActive }) =>
                            cn(
                                "text-muted-foreground hover:text-foreground flex items-center gap-2 rounded-sm px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors",
                                isActive && "bg-background text-foreground shadow-xs"
                            )
                        }
                    >
                        <tab.icon className="size-4" />
                        {tab.label}
                    </NavLink>
                ))}
            </nav>
            <AsyncBoundary>
                <Outlet />
            </AsyncBoundary>
        </div>
    );
};
