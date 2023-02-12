import { FC } from "react";

import { PageTitle } from "../../components/PageTitle";
import { Table, TableHeadItem, TableHeadRow } from "../../components/Table";
import { useAllContests } from "../../hooks/contest/useAllContests";
import { useMappedContests } from "../../hooks/contest/useMappedContests";
import { useSelfContestMembers } from "../../hooks/contest/useSelfContestMembers";
import { ContestListItem } from "./ContestListItem";

export const ContestsPage: FC = () => {
    const { isSuccess, data: contests } = useAllContests();
    const { data: contestMembers } = useSelfContestMembers();

    const completeContests = useMappedContests(contests, contestMembers);

    if (!isSuccess) return <span>Loading...</span>;

    return (
        <div tw={"w-full flex flex-col"}>
            <PageTitle>Contests</PageTitle>
            <Table>
                <thead>
                    <TableHeadRow>
                        <TableHeadItem>Name</TableHeadItem>
                        <TableHeadItem>Start time</TableHeadItem>
                        <TableHeadItem>Starts</TableHeadItem>
                        <TableHeadItem>Duration</TableHeadItem>
                        <TableHeadItem>Partaking</TableHeadItem>
                    </TableHeadRow>
                </thead>
                <tbody>
                    {completeContests.map((c) => (
                        <ContestListItem contest={c} key={c.id.toString()} />
                    ))}
                </tbody>
            </Table>
        </div>
    );
};
