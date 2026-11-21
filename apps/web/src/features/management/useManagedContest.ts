import { useSuspenseQuery } from "@tanstack/react-query";
import { useParams } from "react-router";

import { contestQueries } from "@/api/contests";

/** The contest of the current `/management/:contestId/*` route. */
export const useManagedContest = () => {
    const { contestId } = useParams<{ contestId: string }>();
    const { data } = useSuspenseQuery(contestQueries.detail(contestId ?? "0"));

    return data;
};
