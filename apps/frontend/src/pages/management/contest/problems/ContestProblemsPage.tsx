import { FC, useState } from "react";
import { FiPlus } from "react-icons/all";

import { SimpleButton } from "../../../../components/SimpleButton";
import { Table, TableHeadItem, TableHeadRow } from "../../../../components/Table";
import { useContestContext } from "../../../../context/constestContext";
import { useAllProblems } from "../../../../hooks/problem/useAllProblems";
import { CreateProblemModal } from "./CreateProblemModal";
import { ProblemListItem } from "./ProblemListItem";

export const ContestProblemsPage: FC = () => {
    const { contest } = useContestContext();

    const [modalOpen, setModalOpen] = useState(false);

    const { data: problems } = useAllProblems(contest.id);

    return (
        <div tw={"w-full flex flex-col items-end justify-center gap-4"}>
            <SimpleButton prependIcon={FiPlus} onClick={() => setModalOpen(true)}>
                Create new
            </SimpleButton>
            <CreateProblemModal
                isOpen={modalOpen}
                onRequestClose={() => setModalOpen(false)}
                onAfterClose={() => setModalOpen(false)}
            />

            <Table tw={"w-full"}>
                <thead>
                    <TableHeadRow>
                        <TableHeadItem>Name</TableHeadItem>
                        <TableHeadItem>Score</TableHeadItem>
                        <TableHeadItem>Users</TableHeadItem>
                        <TableHeadItem>Solves</TableHeadItem>
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
