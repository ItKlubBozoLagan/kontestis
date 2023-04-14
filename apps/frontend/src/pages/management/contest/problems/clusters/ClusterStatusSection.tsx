import { ClusterWithStatus } from "@kontestis/models";
import { FC } from "react";
import { FiCheck, FiClock, FiLayers, FiX } from "react-icons/all";
import { useQueryClient } from "react-query";
import { theme } from "twin.macro";

import { http } from "../../../../../api/http";
import { SimpleButton } from "../../../../../components/SimpleButton";
import { LimitBox } from "../../../../problems/ProblemViewPage";

type Properties = {
    cluster: ClusterWithStatus;
};

export const ClusterStatusSection: FC<Properties> = ({ cluster }) => {
    const queryClient = useQueryClient();

    return (
        <div tw={"w-full self-center flex flex-col gap-2"}>
            {cluster.status === "cached" ? (
                <LimitBox
                    title={"Status"}
                    value={"Ready (cached)"}
                    icon={FiCheck}
                    tw={"bg-green-100"}
                />
            ) : cluster.status === "generator_error" ? (
                <LimitBox title={"Status"} value={"Generator error"} icon={FiX} tw={"bg-red-200"} />
            ) : cluster.status === "solution_error" ? (
                <LimitBox title={"Status"} value={"Solution error"} icon={FiX} tw={"bg-red-200"} />
            ) : cluster.status === "pending" ? (
                <LimitBox icon={FiClock} title={"Status"} value={"Pending"} tw={"bg-yellow-100"} />
            ) : (
                <LimitBox
                    icon={FiLayers}
                    title={"Status"}
                    value={"Ready (uncached)"}
                    tw={"bg-blue-100"}
                />
            )}
            <div tw={"flex justify-around mt-2 gap-2"}>
                <SimpleButton
                    tw={"w-full"}
                    type={"button"}
                    color={theme`colors.red.300`!}
                    onClick={async () => {
                        // TODO: mutations
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
                    Drop cache
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
                    Generate
                </SimpleButton>
            </div>
        </div>
    );
};
