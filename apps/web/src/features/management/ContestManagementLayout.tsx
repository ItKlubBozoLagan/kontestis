import { ContestMemberPermissions } from "@kontestis/models";
import { useSuspenseQuery } from "@tanstack/react-query";
import {
    Activity,
    BarChart3,
    ChevronLeft,
    ExternalLink,
    LayoutGrid,
    Megaphone,
    MessageSquare,
    ShieldAlert,
    Users,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link, NavLink, Outlet } from "react-router";

import { useCurrentUser } from "@/api/auth";
import { contestQueries } from "@/api/contests";
import { organisationQueries } from "@/api/organisations";
import { AsyncBoundary } from "@/components/common/AsyncBoundary";
import { EmptyState } from "@/components/common/EmptyState";
import { ContestPhaseBadge } from "@/components/contest/ContestPhaseBadge";
import { Button } from "@/components/ui/button";
import { useManagedContest } from "@/features/management/useManagedContest";
import { usePageTitle } from "@/hooks/usePageTitle";
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
    const user = useCurrentUser();
    const contest = useManagedContest();

    usePageTitle(contest.name);

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

    return (
        <div className="flex w-full flex-col gap-4">
            <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                    <Link
                        to="/management"
                        className="text-muted-foreground hover:text-primary flex items-center gap-1 text-sm"
                    >
                        <ChevronLeft className="size-4" />
                        {t("management.layout.breadcrumb")}
                    </Link>
                    <span className="text-muted-foreground" aria-hidden>
                        /
                    </span>
                    <h1 className="min-w-0 truncate text-xl font-medium tracking-tight">
                        <Link to={`/management/${contest.id}/overview`} className="hover:underline">
                            {contest.name}
                        </Link>
                    </h1>
                    <ContestPhaseBadge contest={contest} />
                </div>
                <Button variant="outline" size="sm" asChild>
                    <Link to={`/contest/${contest.id}`}>
                        <ExternalLink />
                        {t("management.layout.viewAsParticipant")}
                    </Link>
                </Button>
            </header>
            <nav
                aria-label={contest.name}
                className="bg-muted/70 grid w-full grid-cols-3 overflow-hidden rounded-md border sm:flex"
            >
                {visibleTabs.map((tab) => (
                    <NavLink
                        key={tab.path}
                        to={tab.path}
                        className={({ isActive }) =>
                            cn(
                                "relative flex flex-1 flex-col items-center justify-center gap-1 px-2 py-2 text-xs font-medium transition-colors sm:flex-row sm:gap-2 sm:px-4 sm:py-2.5 sm:text-sm sm:whitespace-nowrap",
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
