import type { Cluster, Contest } from "@kontestis/models";
import type { TFunction } from "i18next";

import type { VisibleProblem } from "@/api/problems";
import { formatDateTime, formatDuration } from "@/lib/format";

export type CheckStatus = "pass" | "warn" | "fail" | "loading";

export type ReadinessCheck = {
    id: string;
    status: CheckStatus;
    title: string;
    detail: string;
    /** Where the problem is fixed (or, for passing checks, where it can be looked at). */
    href?: string;
};

export type ReadinessInput = {
    contest: Contest;
    problems: VisibleProblem[];
    /** problem id -> clusters, `undefined` while loading */
    clusters: Map<string, Cluster[] | undefined>;
    /** cluster id -> number of testcases (non-sample clusters only), `undefined` while loading */
    testcaseCounts: Map<string, number | undefined>;
    participants: number;
    now: number;
    t: TFunction;
};

type Offender = { problem: VisibleProblem; cluster?: Cluster };

const ERROR_STATES = new Set(["generator-error", "validation-error", "solution-error"]);
const SHOWN_NAMES = 3;

const base = (input: ReadinessInput) => `/management/${input.contest.id}`;

const offenderHref = (input: ReadinessInput, { problem, cluster }: Offender) =>
    `${base(input)}/problems/${problem.id}${cluster ? `/${cluster.id}` : ""}`;

/** "A, B, C +2 more", each problem named once. */
const names = (input: ReadinessInput, offenders: readonly Offender[]) => {
    const titles = [...new Set(offenders.map((it) => it.problem.title))];
    const shown = titles.slice(0, SHOWN_NAMES).join(", ");
    const rest = titles.length - SHOWN_NAMES;

    return rest > 0
        ? `${shown} ${input.t("management.overview.readiness.more", { count: rest })}`
        : shown;
};

const check = (
    id: string,
    status: CheckStatus,
    title: string,
    detail: string,
    href?: string
): ReadinessCheck => ({ id, status, title, detail, href });

const loading = (input: ReadinessInput, id: string, title: string) =>
    check(id, "loading", title, input.t("management.overview.readiness.checking"));

const checkProblems = (input: ReadinessInput) => {
    const { t, problems } = input;
    const title = t("management.overview.readiness.problems.title");
    const href = `${base(input)}/problems`;

    return problems.length === 0
        ? check("problems", "fail", title, t("management.overview.readiness.problems.fail"), href)
        : check(
              "problems",
              "pass",
              title,
              t("management.overview.readiness.problems.pass", { count: problems.length }),
              href
          );
};

const allClusters = (input: ReadinessInput) =>
    input.problems.flatMap((problem) =>
        (input.clusters.get(problem.id.toString()) ?? []).map((cluster) => ({ problem, cluster }))
    );

const clustersLoaded = (input: ReadinessInput) =>
    input.problems.every((problem) => input.clusters.get(problem.id.toString()) !== undefined);

const checkClusters = (input: ReadinessInput) => {
    const { t } = input;
    const title = t("management.overview.readiness.clusters.title");

    if (!clustersLoaded(input)) return loading(input, "clusters", title);

    const withoutClusters = input.problems
        .filter((problem) => input.clusters.get(problem.id.toString())?.length === 0)
        .map((problem) => ({ problem }));

    if (withoutClusters.length > 0)
        return check(
            "clusters",
            "fail",
            title,
            t("management.overview.readiness.clusters.noClusters", {
                problems: names(input, withoutClusters),
            }),
            offenderHref(input, withoutClusters[0])
        );

    const scored = allClusters(input).filter(({ cluster }) => !cluster.is_sample);
    const counts = scored.map(({ cluster }) => input.testcaseCounts.get(cluster.id.toString()));

    if (counts.includes(undefined)) return loading(input, "clusters", title);

    const empty = scored.filter((_, index) => counts[index] === 0);

    if (empty.length > 0)
        return check(
            "clusters",
            "fail",
            title,
            t("management.overview.readiness.clusters.noTestcases", {
                problems: names(input, empty),
            }),
            offenderHref(input, empty[0])
        );

    return check("clusters", "pass", title, t("management.overview.readiness.clusters.pass"));
};

const checkGeneration = (input: ReadinessInput) => {
    const { t } = input;
    const title = t("management.overview.readiness.generation.title");

    if (!clustersLoaded(input)) return loading(input, "generation", title);

    const clusters = allClusters(input);
    const failed = clusters.filter(({ cluster }) => ERROR_STATES.has(cluster.status));
    const pending = clusters.filter(({ cluster }) => cluster.status === "pending");
    const notReady = clusters.filter(({ cluster }) => cluster.status === "not-ready");

    const [status, key, offenders] =
        failed.length > 0
            ? (["fail", "error", failed] as const)
            : pending.length > 0
            ? (["warn", "pending", pending] as const)
            : notReady.length > 0
            ? (["warn", "notReady", notReady] as const)
            : (["pass", "pass", []] as const);

    return check(
        "generation",
        status,
        title,
        t(`management.overview.readiness.generation.${key}`, {
            problems: names(input, offenders),
        }),
        offenders.length > 0 ? offenderHref(input, offenders[0]) : undefined
    );
};

const checkSolutions = (input: ReadinessInput) => {
    const { t } = input;
    const title = t("management.overview.readiness.solutions.title");
    const missing = input.problems
        .filter((problem) => !problem.solution_code?.trim())
        .map((problem) => ({ problem }));

    if (missing.length === 0)
        return check("solutions", "pass", title, t("management.overview.readiness.solutions.pass"));

    return check(
        "solutions",
        "warn",
        title,
        t("management.overview.readiness.solutions.warn", { problems: names(input, missing) }),
        offenderHref(input, missing[0])
    );
};

const clusterSum = (input: ReadinessInput, problem: VisibleProblem) =>
    (input.clusters.get(problem.id.toString()) ?? []).reduce(
        (sum, cluster) => sum + cluster.awarded_score,
        0
    );

const checkPoints = (input: ReadinessInput) => {
    const { t, problems } = input;
    const title = t("management.overview.readiness.points.title");

    if (!clustersLoaded(input)) return loading(input, "points", title);

    const zero = problems.filter((problem) => problem.score <= 0).map((problem) => ({ problem }));
    // the score comes from the problem list and should equal the sum of its clusters
    const mismatched = problems
        .filter((problem) => problem.score !== clusterSum(input, problem))
        .map((problem) => ({ problem }));
    const offenders = zero.length > 0 ? zero : mismatched;

    if (offenders.length === 0)
        return check(
            "points",
            "pass",
            title,
            t("management.overview.readiness.points.pass", {
                total: problems.reduce((sum, problem) => sum + problem.score, 0),
            })
        );

    return check(
        "points",
        "warn",
        title,
        t(`management.overview.readiness.points.${zero.length > 0 ? "zero" : "mismatch"}`, {
            problems: names(input, offenders),
        }),
        offenderHref(input, offenders[0])
    );
};

const checkSchedule = (input: ReadinessInput) => {
    const { t, contest, now } = input;
    const start = contest.start_time.getTime();
    const end = start + contest.duration_seconds * 1000;
    const detail =
        now < start
            ? t("management.overview.readiness.schedule.upcoming", {
                  time: formatDuration(Math.floor((start - now) / 60_000) * 60_000),
                  date: formatDateTime(contest.start_time),
                  duration: formatDuration(contest.duration_seconds * 1000),
              })
            : t("management.overview.readiness.schedule.running", {
                  date: formatDateTime(new Date(end)),
              });

    return check(
        "schedule",
        contest.duration_seconds > 0 ? "pass" : "fail",
        t("management.overview.readiness.schedule.title"),
        detail
    );
};

const checkVisibility = (input: ReadinessInput) =>
    check(
        "visibility",
        "pass",
        input.t("management.overview.readiness.visibility.title"),
        input.t(
            input.contest.public
                ? "management.overview.readiness.visibility.public"
                : "management.overview.readiness.visibility.private"
        )
    );

const checkParticipants = (input: ReadinessInput) => {
    const { t, participants } = input;

    return check(
        "participants",
        participants > 0 ? "pass" : "warn",
        t("management.overview.readiness.participants.title"),
        participants > 0
            ? t("management.overview.readiness.participants.pass", { count: participants })
            : t("management.overview.readiness.participants.warn"),
        `${base(input)}/participants`
    );
};

/** Every readiness check in display order. Problem-level checks are skipped without problems. */
export const readinessChecks = (input: ReadinessInput): ReadinessCheck[] => [
    checkProblems(input),
    ...(input.problems.length > 0
        ? [checkClusters(input), checkGeneration(input), checkSolutions(input), checkPoints(input)]
        : []),
    checkSchedule(input),
    checkVisibility(input),
    checkParticipants(input),
];

export type ReadinessSummary = { status: CheckStatus; fails: number; warnings: number };

export const summarise = (checks: ReadinessCheck[]): ReadinessSummary => {
    const fails = checks.filter((it) => it.status === "fail").length;
    const warnings = checks.filter((it) => it.status === "warn").length;
    const pending = checks.some((it) => it.status === "loading");

    const status: CheckStatus =
        fails > 0 ? "fail" : pending ? "loading" : warnings > 0 ? "warn" : "pass";

    return { status, fails, warnings };
};
