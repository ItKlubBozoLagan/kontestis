import { Cluster } from "@kontestis/models";
import { FC, useState } from "react";
import { FiCheck, FiChevronDown, FiChevronUp, FiClock, FiLayers, FiX } from "react-icons/all";
import { useQueryClient } from "react-query";
import { theme } from "twin.macro";

import { http } from "../../../../../api/http";
import { SimpleButton } from "../../../../../components/SimpleButton";
import { useTranslation } from "../../../../../hooks/useTranslation";
import { LimitBox } from "../../../../problems/ProblemViewPage";

type Properties = {
    cluster: Cluster;
};

const parseError = (error: string) => {
    const lines = error.split("\n");
    const [firstLine, ...restLines] = lines;
    const details = restLines.join("\n");

    return {
        summary: firstLine,
        hasDetails: details.trim().length > 0,
        details: details,
    };
};

// eslint-disable-next-line sonarjs/cognitive-complexity
export const ClusterStatusSection: FC<Properties> = ({ cluster }) => {
    const queryClient = useQueryClient();
    const { t } = useTranslation();
    const [errorExpanded, setErrorExpanded] = useState(false);

    const errorInfo = cluster.error ? parseError(cluster.error) : null;

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
                        "contests.management.individual.problems.cluster.info.generator.status.notReady"
                    )}
                    tw={"bg-blue-100"}
                />
            )}
            {errorInfo && (
                <div tw={"w-full p-3 bg-red-50 border-2 border-red-300 rounded"}>
                    <div tw={"flex items-start justify-between"}>
                        <div tw={"flex-1"}>
                            <div tw={"font-bold text-red-700 text-sm mb-1"}>Error Details:</div>
                            <div tw={"text-red-600 text-sm"}>{errorInfo.summary}</div>
                        </div>
                        {errorInfo.hasDetails && (
                            <button
                                type="button"
                                onClick={() => setErrorExpanded(!errorExpanded)}
                                tw={"ml-2 p-1 hover:bg-red-100 rounded transition-colors"}
                                aria-label={errorExpanded ? "Collapse details" : "Expand details"}
                            >
                                {errorExpanded ? (
                                    <FiChevronUp tw={"text-red-700"} size={20} />
                                ) : (
                                    <FiChevronDown tw={"text-red-700"} size={20} />
                                )}
                            </button>
                        )}
                    </div>
                    {errorInfo.hasDetails && errorExpanded && (
                        <div tw={"mt-3 pt-3 border-t border-red-200"}>
                            <div
                                tw={
                                    "text-red-600 text-xs font-mono whitespace-pre-wrap bg-red-100 p-2 rounded"
                                }
                            >
                                {errorInfo.details}
                            </div>
                        </div>
                    )}
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

                        queryClient.invalidateQueries([
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

                        queryClient.invalidateQueries([
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
