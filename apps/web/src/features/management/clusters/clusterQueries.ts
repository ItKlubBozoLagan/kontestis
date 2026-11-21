import { problemQueries } from "@/api/problems";

/** Clusters of a problem, polled while any of them is being generated. */
export const pollingClusters = (problemId: bigint | string) => ({
    ...problemQueries.clusters(problemId),
    refetchInterval: (query: { state: { data?: { status: string }[] } }) =>
        query.state.data?.some((cluster) => cluster.status === "pending") ? 1500 : false,
});
