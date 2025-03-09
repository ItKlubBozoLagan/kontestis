import { FC, useMemo } from "react";

import { useAllContests } from "@/hooks/contest/useAllContests";
import { ContestCard } from "@/pages/dashboard/contest/ContestCard";

export const DashboardPage: FC = () => {
    const contests = useAllContests();

    const sorted = useMemo(() => {
        if (!contests.data) return [];

        return contests.data.sort((a, b) => Number(b.id - a.id)); //.sort((a, b) => a.);
    }, [contests.data]);

    if (!sorted) return <div>Loading...</div>;

    return (
        <div className={"w-full flex flex-col gap-4"}>
            <span className={"text-2xl mb-2"}>Contests </span>
            {contests.data &&
                contests.data.map((contest) => <ContestCard contest={contest} key={contest.id} />)}
        </div>
    );
};
