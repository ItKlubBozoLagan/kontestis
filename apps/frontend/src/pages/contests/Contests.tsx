import {
    ContestMemberPermissions,
    ContestWithRegistrationStatus,
    hasContestPermission,
} from "@kontestis/models";
import { FC, useMemo } from "react";
import * as R from "remeda";

import { PageTitle } from "../../components/PageTitle";
import { Table, TableHeadItem, TableHeadRow } from "../../components/Table";
import { useAllContests } from "../../hooks/contest/useAllContests";
import { useSelfContestMembers } from "../../hooks/contest/useSelfContestMembers";
import { ContestListItem } from "./ContestListItem";

export const Contests: FC = () => {
    const { isSuccess, data: contests } = useAllContests();
    const { isSuccess: isSuccessMembers, data: contestMembers } = useSelfContestMembers();

    const completeContests = useMemo<ContestWithRegistrationStatus[]>(() => {
        if (!isSuccess || !isSuccessMembers) return [];

        return R.pipe(
            contests,
            R.sort((a, b) => {
                const firstDone = a.start_time.getTime() + a.duration_seconds * 1000 >= Date.now();
                const secondDone = b.start_time.getTime() + b.duration_seconds * 1000 >= Date.now();

                if (firstDone != secondDone) {
                    return firstDone ? -1 : 1;
                }

                if (a.start_time.getTime() == b.start_time.getTime()) return 0;

                return a.start_time.getTime() > b.start_time.getTime() ? 1 : -1;
            }),
            R.map((contest) =>
                R.addProp(
                    contest,
                    "registered",
                    contestMembers.some(
                        (it) =>
                            contest.id === it.contest_id &&
                            hasContestPermission(
                                it.contest_permissions,
                                ContestMemberPermissions.VIEW
                            )
                    )
                )
            )
        );
    }, [isSuccess, isSuccessMembers, contests, contestMembers]);

    if (!isSuccess) return <span>Loading...</span>;

    return (
        <div tw={"w-full flex flex-col"}>
            <PageTitle>Contests:</PageTitle>
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
