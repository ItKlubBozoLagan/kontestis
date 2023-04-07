import { AdminPermissions, ContestMemberPermissions } from "@kontestis/models";
import { FC, useState } from "react";
import { FiPlus } from "react-icons/all";

import { CanContestMember } from "../../../../components/CanContestMember";
import { SimpleButton } from "../../../../components/SimpleButton";
import { Table, TableHeadItem, TableHeadRow } from "../../../../components/Table";
import { useContestContext } from "../../../../context/constestContext";
import { useAllProblems } from "../../../../hooks/problem/useAllProblems";
import { useTranslation } from "../../../../hooks/useTranslation";
import { CreateProblemModal } from "./CreateProblemModal";
import { ProblemListItem } from "./ProblemListItem";

export const ContestProblemsPage: FC = () => {
    const { contest, member } = useContestContext();

    const [modalOpen, setModalOpen] = useState(false);

    const { data: problems } = useAllProblems(contest.id);

    const { t } = useTranslation();

    return (
        <div tw={"w-full flex flex-col items-end justify-center gap-4"}>
            <CanContestMember
                member={member}
                permission={ContestMemberPermissions.EDIT}
                adminPermission={AdminPermissions.EDIT_CONTEST}
            >
                <SimpleButton prependIcon={FiPlus} onClick={() => setModalOpen(true)}>
                    {t("contests.management.individual.problems.createButton")}
                </SimpleButton>
            </CanContestMember>
            <CreateProblemModal
                isOpen={modalOpen}
                onRequestClose={() => setModalOpen(false)}
                onAfterClose={() => setModalOpen(false)}
            />

            <Table tw={"w-full"}>
                <thead>
                    <TableHeadRow>
                        <TableHeadItem>
                            {t("contests.management.individual.problems.table.head.name")}
                        </TableHeadItem>
                        <TableHeadItem>
                            {t("contests.management.individual.problems.table.head.score")}
                        </TableHeadItem>
                        <TableHeadItem>
                            {t("contests.management.individual.problems.table.head.users")}
                        </TableHeadItem>
                        <TableHeadItem>
                            {t("contests.management.individual.problems.table.head.solves")}
                        </TableHeadItem>
                    </TableHeadRow>
                </thead>
                <tbody>
                    {(problems ?? []).map((p) => (
                        <ProblemListItem problem={p} key={p.id + ""} />
                    ))}
                </tbody>
            </Table>
        </div>
    );
};
