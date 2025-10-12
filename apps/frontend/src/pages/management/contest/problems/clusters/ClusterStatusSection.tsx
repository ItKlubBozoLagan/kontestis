import { ClusterWithStatus } from "@kontestis/models";
import { FC } from "react";
import { FiCheck, FiClock, FiLayers, FiX } from "react-icons/all";
import { useQueryClient } from "react-query";
import { theme } from "twin.macro";

import { http } from "../../../../../api/http";
import { SimpleButton } from "../../../../../components/SimpleButton";
import { useTranslation } from "../../../../../hooks/useTranslation";
import { LimitBox } from "../../../../problems/ProblemViewPage";

type Properties = {
    cluster: ClusterWithStatus;
};

export const ClusterStatusSection: FC<Properties> = ({ cluster }) => {
    const queryClient = useQueryClient();

    const { t } = useTranslation();

    return (
        <div tw={"w-full self-center flex flex-col gap-2"}>
            {cluster.status === "ready" ? (
                <LimitBox
                    title={t(
                        "contests.management.individual.problems.cluster.info.generator.status.title"
                    )}
                    value={t(
                        "contests.management.individual.problems.cluster.info.generator.status.cached"
                    )}
                    icon={FiCheck}
                    tw={"bg-green-100"}
                />
            ) : cluster.status === "generator-error" ? (
                <LimitBox
                    title={t(
                        "contests.management.individual.problems.cluster.info.generator.status.title"
                    )}
                    value={t(
                        "contests.management.individual.problems.cluster.info.generator.status.errors.generator"
                    )}
                    icon={FiX}
                    tw={"bg-red-200"}
                />
            ) : cluster.status === "solution-error" ? (
                <LimitBox
                    title={t(
                        "contests.management.individual.problems.cluster.info.generator.status.title"
                    )}
                    value={t(
                        "contests.management.individual.problems.cluster.info.generator.status.errors.solution"
                    )}
                    icon={FiX}
                    tw={"bg-red-200"}
                />
            ) : cluster.status === "validation-error" ? (
                <LimitBox
                    title={t(
                        "contests.management.individual.problems.cluster.info.generator.status.title"
                    )}
                    value={t(
                        "contests.management.individual.problems.cluster.info.generator.status.errors.validation"
                    )}
                    icon={FiX}
                    tw={"bg-red-200"}
                />
            ) : cluster.status === "pending" ? (
                <LimitBox
                    icon={FiClock}
                    title={t(
                        "contests.management.individual.problems.cluster.info.generator.status.title"
                    )}
                    value={t(
                        "contests.management.individual.problems.cluster.info.generator.status.pending"
                    )}
                    tw={"bg-yellow-100"}
                />
            ) : (
                <LimitBox
                    icon={FiLayers}
                    title={t(
                        "contests.management.individual.problems.cluster.info.generator.status.title"
                    )}
                    value={t(
                        "contests.management.individual.problems.cluster.info.generator.status.uncached"
                    )}
                    tw={"bg-blue-100"}
                />
            )}
            {cluster.error && (
                <div tw={"w-full p-3 bg-red-100 border border-red-300 rounded text-sm"}>
                    <div tw={"font-bold text-red-700"}>Error:</div>
                    <div tw={"text-red-600 mt-1 font-mono whitespace-pre-wrap"}>
                        {cluster.error}
                    </div>
                </div>
            )}
            <div tw={"flex justify-around mt-2 gap-2"}>
                <SimpleButton
                    tw={"w-full"}
                    type={"button"}
                    color={theme`colors.red.300`!}
                    onClick={async () => {
                        await http.post(
                            `/problem/${cluster.problem_id}/cluster/${cluster.id}/cache/drop`
                        );

                        const _ = queryClient.invalidateQueries([
                            "problem",
                            cluster.problem_id,
                            "cluster",
                            cluster.id,
                        ]);
                    }}
                >
                    {t("contests.management.individual.problems.cluster.info.generator.dropCache")}
                </SimpleButton>
                <SimpleButton
                    tw={"w-full"}
                    type={"button"}
                    onClick={async () => {
                        await http.post(
                            `/problem/${cluster.problem_id}/cluster/${cluster.id}/cache/regenerate`
                        );

                        const _ = queryClient.invalidateQueries([
                            "problem",
                            cluster.problem_id,
                            "cluster",
                            cluster.id,
                        ]);
                    }}
                >
                    {t("contests.management.individual.problems.cluster.info.generator.generate")}
                </SimpleButton>
            </div>
        </div>
    );
};
