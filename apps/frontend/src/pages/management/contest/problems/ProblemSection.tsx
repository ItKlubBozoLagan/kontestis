import { Problem } from "@kontestis/models";
import { FC, useState } from "react";
import { FiPlus } from "react-icons/all";

import { SimpleButton } from "../../../../components/SimpleButton";
import { TitledSection } from "../../../../components/TitledSection";
import { useAllClusters } from "../../../../hooks/problem/cluster/useAllClusters";
import { ClusterSection } from "./clusters/ClusterSection";
import { CreateClusterModal } from "./clusters/CreateClusterModal";

type Properties = {
    problem: Problem;
};

export const ProblemSection: FC<Properties> = ({ problem }) => {
    const { data: clusters } = useAllClusters(problem.id);

    const [modalOpen, setModalOpen] = useState(false);

    return (
        <TitledSection title={problem.title} tw={"items-end"}>
            <SimpleButton prependIcon={FiPlus} onClick={() => setModalOpen(true)}>
                Create cluster
            </SimpleButton>
            <CreateClusterModal
                isOpen={modalOpen}
                onRequestClose={() => setModalOpen(false)}
                onAfterClose={() => setModalOpen(false)}
                problem={problem}
            />
            <div tw={"flex flex-col gap-4 w-full items-center"}>
                {problem.description}
                {clusters
                    ?.sort((a, b) => Number(a.id - b.id))
                    .map((cluster, index) => (
                        <ClusterSection
                            key={cluster.id.toString()}
                            cluster={cluster}
                            index={index + 1}
                        />
                    ))}
            </div>
        </TitledSection>
    );
};
