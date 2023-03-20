import { Cluster } from "@kontestis/models";
import { FC, useState } from "react";
import { FiPlus } from "react-icons/all";

import { SimpleButton } from "../../../../../components/SimpleButton";
import { TitledSection } from "../../../../../components/TitledSection";
import { useAllTestcases } from "../../../../../hooks/problem/cluster/testcase/useAllTestcases";
import { CreateTestcaseModal } from "./CreateTestcaseModal";

type Properties = {
    index: number;
    cluster: Cluster;
};

export const ClusterSection: FC<Properties> = ({ index, cluster }) => {
    const { data: testcases } = useAllTestcases([cluster.problem_id, cluster.id]);

    const [modalOpen, setModalOpen] = useState(false);

    return (
        <TitledSection title={"Cluster #" + index}>
            <SimpleButton prependIcon={FiPlus} onClick={() => setModalOpen(true)}>
                Create testcase
            </SimpleButton>
            <CreateTestcaseModal
                isOpen={modalOpen}
                onRequestClose={() => setModalOpen(false)}
                onAfterClose={() => setModalOpen(false)}
                cluster={cluster}
            />
            <div tw={"flex flex-col gap-4 w-full items-center"}>
                <span>Score: {cluster.awarded_score}</span>
                {testcases
                    ?.sort((a, b) => Number(a.id - b.id))
                    .map((cluster, index) => (
                        <div key={cluster.id.toString()} tw={"bg-neutral-200 p-2"}>
                            Testcase #{index + 1}
                        </div>
                    ))}
            </div>
        </TitledSection>
    );
};
