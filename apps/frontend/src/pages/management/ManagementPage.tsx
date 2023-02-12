import { ContestMemberPermissions, hasContestPermission } from "@kontestis/models";
import { FC, useMemo, useState } from "react";
import { FiPlus } from "react-icons/all";

import { PageTitle } from "../../components/PageTitle";
import { SimpleButton } from "../../components/SimpleButton";
import { Table, TableHeadItem, TableHeadRow, TableItem, TableRow } from "../../components/Table";
import { useAllContests } from "../../hooks/contest/useAllContests";
import { useMappedContests } from "../../hooks/contest/useMappedContests";
import { useSelfContestMembers } from "../../hooks/contest/useSelfContestMembers";
import { ContestListItem } from "../contests/ContestListItem";
import { CreateContestModal } from "./CreateContestModal";

export const ManagementPage: FC = () => {
    const [modalOpen, setModalOpen] = useState(false);

    const { data: contests } = useAllContests();
    const { data: contestMembers } = useSelfContestMembers();

    const completeContests = useMappedContests(contests, contestMembers);

    const myContests = useMemo(
        () =>
            completeContests.filter((it) =>
                hasContestPermission(it.permissions, ContestMemberPermissions.VIEW_PRIVATE)
            ),
        [completeContests]
    );

    return (
        <div tw={"w-full flex flex-col"}>
            <PageTitle>
                Your contests
                <SimpleButton prependIcon={FiPlus} onClick={() => setModalOpen(true)}>
                    Create new
                </SimpleButton>
            </PageTitle>
            <CreateContestModal
                isOpen={modalOpen}
                onRequestClose={() => setModalOpen(false)}
                onAfterClose={() => setModalOpen(false)}
            />
            <Table>
                <thead>
                    <TableHeadRow>
                        <TableHeadItem>Name</TableHeadItem>
                        <TableHeadItem>Start time</TableHeadItem>
                        <TableHeadItem>Starts</TableHeadItem>
                        <TableHeadItem>Duration</TableHeadItem>
                    </TableHeadRow>
                </thead>
                <tbody>
                    <TableRow>
                        {myContests.length === 0 && (
                            <TableItem colSpan={4} tw={"text-center"}>
                                None so far
                            </TableItem>
                        )}
                    </TableRow>
                    {myContests.map((c) => (
                        <ContestListItem adminView contest={c} key={c.id.toString()} />
                    ))}
                </tbody>
            </Table>
        </div>
    );
};
