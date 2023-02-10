import { ContestMemberPermissions, hasContestPermission } from "@kontestis/models";
import { FC, useMemo } from "react";

import { PageTitle } from "../../components/PageTitle";
import { Table, TableHeadItem, TableHeadRow } from "../../components/Table";
import { useAllContests } from "../../hooks/contest/useAllContests";
import { useSelfContestMembers } from "../../hooks/contest/useSelfContestMembers";
import { ContestListItem } from "./ContestListItem";

export const Contests: FC = () => {
    const { isSuccess, data: contests } = useAllContests();
    const { isSuccess: isSuccessMembers, data: contestMembers } = useSelfContestMembers();

    const registeredContests = useMemo<Record<string, boolean>>(() => {
        if (!isSuccessMembers) return {};

        const registeredContests: Record<string, boolean> = {};

        for (const c of contestMembers) {
            registeredContests[c.contest_id + ""] = hasContestPermission(
                c.contest_permissions,
                ContestMemberPermissions.VIEW
            );
        }

        return registeredContests;
    }, [isSuccessMembers, contestMembers]);

    const sortedContests = useMemo(() => {
        if (!isSuccess) return [];

        return contests
            .map((contest) => {
                return {
                    ...contest,
                    start_time: new Date(contest.start_time),
                };
            })
            .sort((a, b) => {
                const firstDone = a.start_time.getTime() + a.duration_seconds * 1000 >= Date.now();
                const secondDone = b.start_time.getTime() + b.duration_seconds * 1000 >= Date.now();

                if (firstDone != secondDone) {
                    return firstDone ? -1 : 1;
                }

                if (a.start_time.getTime() == b.start_time.getTime()) return 0;

                return a.start_time.getTime() > b.start_time.getTime() ? 1 : -1;
            });
    }, [isSuccess, contests]);

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
                        <TableHeadItem>Registration</TableHeadItem>
                    </TableHeadRow>
                </thead>
                <tbody>
                    {sortedContests.map((c) => (
                        <ContestListItem
                            contest={c}
                            key={c.id + ""}
                            registered={registeredContests[c.id + ""] ?? false}
                        />
                    ))}
                </tbody>
            </Table>
        </div>
    );
};
