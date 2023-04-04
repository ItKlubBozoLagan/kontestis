import { ContestMemberPermissions, hasContestPermission } from "@kontestis/models";
import { FC, useMemo, useState } from "react";
import { FiPlus } from "react-icons/all";

import { PageTitle } from "../../components/PageTitle";
import { SimpleButton } from "../../components/SimpleButton";
import { Table, TableHeadItem, TableHeadRow, TableItem, TableRow } from "../../components/Table";
import { useAllContests } from "../../hooks/contest/useAllContests";
import { useMappedContests } from "../../hooks/contest/useMappedContests";
import { useSelfContestMembers } from "../../hooks/contest/useSelfContestMembers";
import { useTranslation } from "../../hooks/useTranslation";
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

    const { t } = useTranslation();

    return (
        <div tw={"w-full flex flex-col"}>
            <PageTitle>
                {t("contests.management.label")}
                <SimpleButton prependIcon={FiPlus} onClick={() => setModalOpen(true)}>
                    {t("contests.management.createButton")}
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
                        <TableHeadItem>{t("contests.table.head.name")}</TableHeadItem>
                        <TableHeadItem>{t("contests.table.head.startTime")}</TableHeadItem>
                        <TableHeadItem>{t("contests.table.head.starts.label")}</TableHeadItem>
                        <TableHeadItem>{t("contests.table.head.duration")}</TableHeadItem>
                        <TableHeadItem>Duration</TableHeadItem>
                    </TableHeadRow>
                </thead>
                <tbody>
                    <TableRow>
                        {myContests.length === 0 && (
                            <TableItem colSpan={4} tw={"text-center"}>
                                {t("contests.management.noContests")}
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
