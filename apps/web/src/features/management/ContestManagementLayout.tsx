import { ContestMemberPermissions } from "@kontestis/models";
import { useSuspenseQuery } from "@tanstack/react-query";
import {
    Activity,
    BarChart3,
    ExternalLink,
    LayoutGrid,
    Megaphone,
    MessageSquare,
    ShieldAlert,
    Users,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link, NavLink, Outlet, useLocation } from "react-router";

import { useCurrentUser } from "@/api/auth";
import { contestQueries } from "@/api/contests";
import { organisationQueries } from "@/api/organisations";
import { AsyncBoundary } from "@/components/common/AsyncBoundary";
import { EmptyState } from "@/components/common/EmptyState";
import { PageHeader } from "@/components/common/PageHeader";
import { ContestPhaseBadge } from "@/components/contest/ContestPhaseBadge";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { useManagedContest } from "@/features/management/useManagedContest";
import { canInContest } from "@/lib/permissions";
import { cn } from "@/lib/utils";

const tabs = [
    { path: "overview", icon: Activity },
    { path: "problems", icon: LayoutGrid },
    { path: "announcements", icon: Megaphone },
    { path: "questions", icon: MessageSquare },
    { path: "participants", icon: Users },
    { path: "results", icon: BarChart3 },
] as const;

export const ContestManagementLayout = () => {
    const { t } = useTranslation();
    const location = useLocation();
    const user = useCurrentUser();
    const contest = useManagedContest();
    const { data: member } = useSuspenseQuery(contestQueries.member(contest.id, user.id));
    const { data: memberships } = useSuspenseQuery(organisationQueries.selfMemberships());

    const organisationPermissions = memberships.find(
        (it) => it.organisation_id === contest.organisation_id
    )?.permissions;

    const allowed = canInContest(
        user,
        member.contest_permissions,
        organisationPermissions,
        ContestMemberPermissions.VIEW_PRIVATE
    );

    if (!allowed) return <EmptyState icon={ShieldAlert} title={t("management.layout.forbidden")} />;

    const visibleTabs = tabs.filter((tab) => tab.path !== "results" || contest.exam);
    const current = visibleTabs.find((tab) =>
        location.pathname.startsWith(`/management/${contest.id}/${tab.path}`)
    );

    return (
        <div className="flex w-full flex-col gap-6">
            <Breadcrumb>
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink asChild>
                            <Link to="/management">{t("management.layout.breadcrumb")}</Link>
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        {current ? (
                            <BreadcrumbLink asChild>
                                <Link to={`/management/${contest.id}/overview`}>
                                    {contest.name}
                                </Link>
                            </BreadcrumbLink>
                        ) : (
                            <BreadcrumbPage>{contest.name}</BreadcrumbPage>
                        )}
                    </BreadcrumbItem>
                    {current && (
                        <>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbPage>
                                    {t(`management.layout.tabs.${current.path}`)}
                                </BreadcrumbPage>
                            </BreadcrumbItem>
                        </>
                    )}
                </BreadcrumbList>
            </Breadcrumb>
            <PageHeader
                title={contest.name}
                description={<ContestPhaseBadge contest={contest} />}
                actions={
                    <Button variant="outline" size="sm" asChild>
                        <Link to={`/contest/${contest.id}`}>
                            <ExternalLink />
                            {t("management.layout.viewAsParticipant")}
                        </Link>
                    </Button>
                }
            />
            <nav className="bg-muted/70 -mt-2 flex w-full overflow-x-auto rounded-md border">
                {visibleTabs.map((tab) => (
                    <NavLink
                        key={tab.path}
                        to={tab.path}
                        className={({ isActive }) =>
                            cn(
                                "relative flex flex-1 items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors",
                                "text-muted-foreground hover:bg-muted hover:text-foreground",
                                isActive &&
                                    "text-foreground bg-background after:bg-primary after:absolute after:inset-x-0 after:bottom-0 after:h-0.5"
                            )
                        }
                    >
                        <tab.icon className="size-4" />
                        {t(`management.layout.tabs.${tab.path}`)}
                    </NavLink>
                ))}
            </nav>
            <AsyncBoundary>
                <Outlet />
            </AsyncBoundary>
        </div>
    );
};
