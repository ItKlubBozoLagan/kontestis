/** URLs inside the problem studio (`/management/:contestId/problems/:problemId/...`). */
export const problemPath = (contestId: bigint | string, problemId: bigint | string) =>
    `/management/${contestId}/problems/${problemId}`;

export const PROBLEM_VIEW_PARAM = "view";

export const SUBMISSIONS_VIEW = "submissions";

export type StudioLocation =
    | { kind: "root"; view: "settings" | "submissions" }
    | { kind: "generators" }
    | { kind: "generator"; generatorId: string }
    | { kind: "cluster"; clusterId: string }
    | { kind: "testcase"; clusterId: string; testcaseId: string };

/** Which studio entry a pathname (+ `?view=`) points at, relative to the problem root. */
export const parseStudioLocation = (
    pathname: string,
    base: string,
    view: string | null
): StudioLocation => {
    const rest = pathname.startsWith(base)
        ? pathname.slice(base.length).split("/").filter(Boolean)
        : [];
    const [first, second] = rest;

    if (first === "generators")
        return second ? { kind: "generator", generatorId: second } : { kind: "generators" };

    if (first && second) return { kind: "testcase", clusterId: first, testcaseId: second };

    if (first) return { kind: "cluster", clusterId: first };

    return { kind: "root", view: view === SUBMISSIONS_VIEW ? "submissions" : "settings" };
};

/** The cluster the current location belongs to, if any. */
export const currentClusterId = (location: StudioLocation) =>
    location.kind === "cluster" || location.kind === "testcase" ? location.clusterId : undefined;

/** `?view=` of the problem root; the old `?tab=submissions` links still open the submissions. */
export const studioView = (params: URLSearchParams) =>
    params.get(PROBLEM_VIEW_PARAM) ??
    (params.get("tab") === SUBMISSIONS_VIEW ? SUBMISSIONS_VIEW : null);
