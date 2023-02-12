import { FC, useState } from "react";
import { FiPlus } from "react-icons/all";

import { SimpleButton } from "../../../../components/SimpleButton";
import { TitledSection } from "../../../../components/TitledSection";
import { useContestContext } from "../../../../context/constestContext";
import { useAllProblems } from "../../../../hooks/problem/useAllProblems";
import { CreateProblemModal } from "./CreateProblemModal";

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
            {problems?.map((problem) => (
                <TitledSection key={problem.id.toString()} title={problem.title}>
                    {problem.title}
                </TitledSection>
            ))}
        </div>
    );
};
