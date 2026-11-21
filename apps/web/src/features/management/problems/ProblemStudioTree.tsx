import type { Cluster } from "@kontestis/models";
import { useQuery } from "@tanstack/react-query";
import {
    ChevronRight,
    FileText,
    History,
    type LucideIcon,
    NotebookPen,
    Plus,
    Wand2,
} from "lucide-react";
import { type ComponentProps, type ReactNode, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

import { problemQueries, type VisibleProblem } from "@/api/problems";
import { Spinner } from "@/components/common/Spinner";
import { Button } from "@/components/ui/button";
import { pollingClusters } from "@/features/management/clusters/clusterQueries";
import { CreateClusterDialog } from "@/features/management/clusters/CreateClusterDialog";
import { CreateTestcaseDialog } from "@/features/management/clusters/CreateTestcaseDialog";
import { GeneratorStateIcon } from "@/features/management/problems/GeneratorStateBadge";
import {
    currentClusterId,
    type StudioLocation,
    SUBMISSIONS_VIEW,
} from "@/features/management/problems/studioPaths";
import { cn } from "@/lib/utils";

const linkClass = cn(
    "flex min-w-0 flex-1 items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors outline-none",
    "text-muted-foreground hover:bg-muted hover:text-foreground",
    "focus-visible:ring-ring/50 focus-visible:ring-[3px]",
    "aria-[current=page]:bg-accent aria-[current=page]:text-accent-foreground aria-[current=page]:font-medium"
);

const TreeLink = ({
    to,
    active,
    icon: Icon,
    children,
    trailing,
}: {
    to: string;
    active: boolean;
    icon?: LucideIcon;
    children: ReactNode;
    trailing?: ReactNode;
}) => (
    <Link to={to} aria-current={active ? "page" : undefined} className={linkClass}>
        {Icon && <Icon aria-hidden className="size-4 shrink-0 opacity-70" />}
        <span className="min-w-0 flex-1 truncate">{children}</span>
        {trailing}
    </Link>
);

const GroupHeading = ({ children, action }: { children: ReactNode; action?: ReactNode }) => (
    <div className="flex h-7 items-center justify-between gap-2 pr-1 pl-2">
        <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            {children}
        </span>
        {action}
    </div>
);

// receives the dialog trigger's props (onClick, aria-*, ref) from `DialogTrigger asChild`
const AddButton = ({ label, ...props }: { label: string } & ComponentProps<typeof Button>) => (
    <Button
        {...props}
        variant="ghost"
        size="icon-xs"
        aria-label={label}
        title={label}
        className="text-muted-foreground hover:text-foreground"
    >
        <Plus />
    </Button>
);

const Empty = ({ children }: { children: ReactNode }) => (
    <p className="text-muted-foreground px-2 py-1 text-xs">{children}</p>
);

type Context = {
    base: string;
    problem: VisibleProblem;
    location: StudioLocation;
    canEdit: boolean;
};

const TestcaseList = ({ context, cluster }: { context: Context; cluster: Cluster }) => {
    const { t } = useTranslation();
    const { base, problem, location, canEdit } = context;
    const { data, isPending } = useQuery(problemQueries.testcases(problem.id, cluster.id));
    const clusterBase = `${base}/${cluster.id}`;

    const testcases = useMemo(
        () => [...(data ?? [])].sort((a, b) => (a.id < b.id ? -1 : 1)),
        [data]
    );

    if (isPending) return <Spinner className="mx-2 my-1 size-4" />;

    return (
        <ul className="ml-[1.375rem] flex flex-col gap-px border-l pl-1.5">
            {testcases.map((testcase, index) => (
                <li key={testcase.id.toString()}>
                    <TreeLink
                        to={`${clusterBase}/${testcase.id}`}
                        icon={FileText}
                        active={
                            location.kind === "testcase" &&
                            location.testcaseId === testcase.id.toString()
                        }
                        trailing={<GeneratorStateIcon state={testcase.status} />}
                    >
                        {t("managementProblems.testcases.name", { index: index + 1 })}
                    </TreeLink>
                </li>
            ))}
            {testcases.length === 0 && (
                <li>
                    <Empty>{t("managementProblems.testcases.empty")}</Empty>
                </li>
            )}
            {canEdit && (
                <li>
                    <CreateTestcaseDialog
                        problemId={problem.id}
                        clusterId={cluster.id}
                        nextIndex={testcases.length + 1}
                        basePath={clusterBase}
                        trigger={
                            <Button
                                variant="ghost"
                                size="xs"
                                className="text-muted-foreground hover:text-foreground w-full justify-start"
                            >
                                <Plus />
                                {t("managementProblems.testcases.create")}
                            </Button>
                        }
                    />
                </li>
            )}
        </ul>
    );
};

const ClusterNode = ({
    context,
    cluster,
    index,
    expanded,
    onToggle,
}: {
    context: Context;
    cluster: Cluster;
    index: number;
    expanded: boolean;
    onToggle: () => void;
}) => {
    const { t } = useTranslation();
    const { base, location } = context;
    const name = t("managementProblems.clusters.name", { index: index + 1 });
    const listId = `studio-cluster-${cluster.id}`;

    return (
        <li>
            <div className="flex items-center gap-0.5">
                <Button
                    variant="ghost"
                    size="icon-xs"
                    aria-expanded={expanded}
                    aria-controls={expanded ? listId : undefined}
                    aria-label={t(
                        expanded
                            ? "managementProblems.studio.collapse"
                            : "managementProblems.studio.expand",
                        { name }
                    )}
                    onClick={onToggle}
                    className="text-muted-foreground"
                >
                    <ChevronRight className={cn("transition-transform", expanded && "rotate-90")} />
                </Button>
                <TreeLink
                    to={`${base}/${cluster.id}`}
                    active={
                        location.kind === "cluster" && location.clusterId === cluster.id.toString()
                    }
                    trailing={
                        <>
                            <span className="font-mono text-xs tabular-nums">
                                {cluster.is_sample
                                    ? t("managementProblems.clusters.sample")
                                    : t("managementProblems.studio.points", {
                                          count: cluster.awarded_score,
                                      })}
                            </span>
                            <GeneratorStateIcon state={cluster.status} />
                        </>
                    }
                >
                    {name}
                </TreeLink>
            </div>
            {expanded && (
                <div id={listId} className="py-0.5">
                    <TestcaseList context={context} cluster={cluster} />
                </div>
            )}
        </li>
    );
};

const ClustersGroup = ({ context }: { context: Context }) => {
    const { t } = useTranslation();
    const { problem, location, canEdit } = context;
    const { data: clusters, isPending } = useQuery(pollingClusters(problem.id));
    // explicit user choices; the cluster in the URL is expanded unless collapsed by hand
    const [toggled, setToggled] = useState<Record<string, boolean>>({});
    const current = currentClusterId(location);

    const isExpanded = (id: string) => toggled[id] ?? id === current;

    return (
        <div className="flex flex-col gap-0.5">
            <GroupHeading
                action={
                    canEdit && (
                        <CreateClusterDialog
                            problemId={problem.id}
                            problemTitle={problem.title}
                            trigger={<AddButton label={t("managementProblems.clusters.create")} />}
                        />
                    )
                }
            >
                {t("managementProblems.problem.clusters")}
            </GroupHeading>
            {isPending && <Spinner className="mx-2 my-1 size-4" />}
            {clusters?.length === 0 && <Empty>{t("managementProblems.studio.noClusters")}</Empty>}
            <ul className="flex flex-col gap-px">
                {clusters?.map((cluster, index) => {
                    const id = cluster.id.toString();

                    return (
                        <ClusterNode
                            key={id}
                            context={context}
                            cluster={cluster}
                            index={index}
                            expanded={isExpanded(id)}
                            onToggle={() =>
                                setToggled((value) => ({ ...value, [id]: !isExpanded(id) }))
                            }
                        />
                    );
                })}
            </ul>
        </div>
    );
};

const GeneratorsGroup = ({ context }: { context: Context }) => {
    const { t } = useTranslation();
    const { base, problem, location } = context;
    const { data: generators } = useQuery(problemQueries.generators(problem.id));

    return (
        <div className="flex flex-col gap-0.5">
            <GroupHeading>{t("managementProblems.problem.generators")}</GroupHeading>
            <ul className="flex flex-col gap-px">
                <li>
                    <TreeLink
                        to={`${base}/generators`}
                        icon={Wand2}
                        active={location.kind === "generators"}
                        trailing={
                            generators && (
                                <span className="font-mono text-xs tabular-nums">
                                    {generators.length}
                                </span>
                            )
                        }
                    >
                        {t("managementProblems.studio.allGenerators")}
                    </TreeLink>
                </li>
                {generators?.map((generator) => (
                    <li key={generator.id.toString()} className="pl-4">
                        <TreeLink
                            to={`${base}/generators/${generator.id}`}
                            active={
                                location.kind === "generator" &&
                                location.generatorId === generator.id.toString()
                            }
                        >
                            {generator.name}
                        </TreeLink>
                    </li>
                ))}
            </ul>
        </div>
    );
};

/** Left pane of the problem studio: every authoring page of one problem as a tree. */
export const ProblemStudioTree = ({
    base,
    problem,
    location,
    canEdit,
}: {
    base: string;
    problem: VisibleProblem;
    location: StudioLocation;
    canEdit: boolean;
}) => {
    const { t } = useTranslation();
    const context: Context = { base, problem, location, canEdit };
    const isRoot = location.kind === "root";

    return (
        <nav aria-label={t("managementProblems.studio.nav")} className="flex flex-col gap-4">
            <div className="flex flex-col gap-0.5 px-2">
                <Link
                    to={base}
                    className="hover:text-primary focus-visible:ring-ring/50 rounded-sm text-base leading-snug font-semibold break-words outline-none focus-visible:ring-[3px]"
                >
                    {problem.title}
                </Link>
                <span className="text-muted-foreground text-xs">
                    {t("managementProblems.studio.totalScore", { score: problem.score })}
                </span>
            </div>
            <ul className="flex flex-col gap-px">
                <li>
                    <TreeLink
                        to={base}
                        icon={NotebookPen}
                        active={isRoot && location.view === "settings"}
                    >
                        {t("managementProblems.studio.statement")}
                    </TreeLink>
                </li>
            </ul>
            <ClustersGroup context={context} />
            <GeneratorsGroup context={context} />
            <ul className="flex flex-col gap-px border-t pt-3">
                <li>
                    <TreeLink
                        to={`${base}?view=${SUBMISSIONS_VIEW}`}
                        icon={History}
                        active={isRoot && location.view === "submissions"}
                    >
                        {t("managementProblems.problem.submissions")}
                    </TreeLink>
                </li>
            </ul>
        </nav>
    );
};
