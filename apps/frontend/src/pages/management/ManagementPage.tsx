import {
    AdminPermissions,
    ContestMemberPermissions,
    hasAdminPermission,
    hasContestPermission,
} from "@kontestis/models";
import { FC, useMemo, useState } from "react";
import { FiPlus } from "react-icons/all";

import { EmptyRow } from "../../components/EmptyRow";
import { PageTitle } from "../../components/PageTitle";
import { SimpleButton } from "../../components/SimpleButton";
import { Table, TableHeadItem, TableHeadRow } from "../../components/Table";
import { useAllContests } from "../../hooks/contest/useAllContests";
import { useMappedContests } from "../../hooks/contest/useMappedContests";
import { useSelfContestMembers } from "../../hooks/contest/useSelfContestMembers";
import { useTranslation } from "../../hooks/useTranslation";
import { useAuthStore } from "../../state/auth";
import { ContestListItem } from "../contests/ContestListItem";
import { CreateContestModal } from "./CreateContestModal";

export const ManagementPage: FC = () => {
    const [modalOpen, setModalOpen] = useState(false);

    const { data: contests } = useAllContests();
    const { data: contestMembers } = useSelfContestMembers();

    const { user } = useAuthStore();

    const completeContests = useMappedContests(contests, contestMembers);

    const myContests = useMemo(
        () =>
            completeContests.filter(
                (it) =>
                    hasContestPermission(it.permissions, ContestMemberPermissions.VIEW_PRIVATE) ||
                    hasAdminPermission(user.permissions, AdminPermissions.VIEW_CONTEST)
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
                    </TableHeadRow>
                </thead>
                <tbody>
                    <EmptyRow contents={myContests} />
                    {myContests.map((contest) => (
                        <ContestListItem adminView contest={contest} key={contest.id.toString()} />
                    ))}
                </tbody>
            </Table>
        </div>
    );
};
