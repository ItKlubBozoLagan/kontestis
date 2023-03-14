import { FC } from "react";

import { PageTitle } from "../../components/PageTitle";
import { useAllContests } from "../../hooks/contest/useAllContests";
import { useMappedContests } from "../../hooks/contest/useMappedContests";
import { useSelfContestMembers } from "../../hooks/contest/useSelfContestMembers";
import { ContestsTable } from "./ContestsTable";

export const ContestsPage: FC = () => {
    const { isSuccess, data: contests } = useAllContests();
    const { data: contestMembers } = useSelfContestMembers();

    const completeContests = useMappedContests(contests, contestMembers);

    if (!isSuccess) return <span>Loading...</span>;

    return (
        <div tw={"w-full flex flex-col"}>
            <PageTitle>Contests</PageTitle>
            <ContestsTable contests={completeContests.filter((c) => c.official)} />
            <PageTitle>Unofficial contests</PageTitle>
            <ContestsTable contests={completeContests.filter((c) => !c.official)} />
        </div>
    );
};
