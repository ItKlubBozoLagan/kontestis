import { useSuspenseQuery } from "@tanstack/react-query";
import { ChevronDown, ListTree } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Outlet, useLocation, useParams, useSearchParams } from "react-router";

import { problemQueries } from "@/api/problems";
import { AsyncBoundary } from "@/components/common/AsyncBoundary";
import { Button } from "@/components/ui/button";
import { ProblemStudioTree } from "@/features/management/problems/ProblemStudioTree";
import {
    parseStudioLocation,
    problemPath,
    studioView,
} from "@/features/management/problems/studioPaths";
import { useManagedContest } from "@/features/management/useManagedContest";
import { useContestAccess } from "@/hooks/useContestAccess";
import { cn } from "@/lib/utils";

/**
 * Two-pane workspace for everything under `problems/:problemId`: a navigation tree of the
 * problem (statement, clusters with testcases, generators, submissions) next to the page.
 * On `xl+` it grows past the 1200px page column (to the navbar's content width) so the editor
 * keeps room next to the tree.
 */
export const ProblemStudioLayout = () => {
    const { t } = useTranslation();
    const contest = useManagedContest();
    const { canEdit } = useContestAccess(contest);
    const { problemId = "0" } = useParams<{ problemId: string }>();
    const { data: problem } = useSuspenseQuery(problemQueries.detail(problemId));
    const routerLocation = useLocation();
    const [params] = useSearchParams();
    // the mobile tree stays open only until the next navigation
    const [openAt, setOpenAt] = useState<string | null>(null);
    const open = openAt === routerLocation.key;

    const base = problemPath(contest.id, problem.id);
    const location = parseStudioLocation(routerLocation.pathname, base, studioView(params));

    return (
        <div className="grid items-start gap-4 lg:grid-cols-[272px_minmax(0,1fr)] lg:gap-6 xl:mx-[calc((100%_-_min(1352px,_100vw_-_4rem))_/_2)]">
            <aside className="bg-card rounded-md border lg:sticky lg:top-[4.5rem] lg:max-h-[calc(100vh-5.5rem)] lg:overflow-y-auto">
                <Button
                    variant="ghost"
                    className="w-full justify-between rounded-md lg:hidden"
                    aria-expanded={open}
                    aria-controls="problem-studio-tree"
                    onClick={() => setOpenAt(open ? null : routerLocation.key)}
                >
                    <span className="flex min-w-0 items-center gap-2">
                        <ListTree />
                        <span className="truncate">{problem.title}</span>
                    </span>
                    <span className="text-muted-foreground flex items-center gap-1 text-xs">
                        {t("managementProblems.studio.nav")}
                        <ChevronDown className={cn("transition-transform", open && "rotate-180")} />
                    </span>
                </Button>
                <div
                    id="problem-studio-tree"
                    className={cn("border-t p-2 lg:block lg:border-t-0", !open && "hidden")}
                >
                    <ProblemStudioTree
                        base={base}
                        problem={problem}
                        location={location}
                        canEdit={canEdit}
                    />
                </div>
            </aside>
            <div className="min-w-0">
                <AsyncBoundary>
                    <Outlet />
                </AsyncBoundary>
            </div>
        </div>
    );
};
