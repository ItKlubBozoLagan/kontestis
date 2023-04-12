import { KubernetesSystemMetrics } from "@kontestis/models";
import { FC, useState } from "react";
import { FiMinus, FiPlus } from "react-icons/all";

import { R } from "../../../../../../util/remeda";
import { MetricsInfoBox } from "./MetricsInfoBox";

type Properties = {
    kubeData: KubernetesSystemMetrics["kubeData"];
};

export const NodesBox: FC<Properties> = ({ kubeData }) => {
    const [expanded, setExpanded] = useState(false);

    const [eachExpanded, setEachExpanded] = useState(
        R.fromPairs(kubeData.nodes.map((it) => [it.name, false]))
    );

    return (
        <MetricsInfoBox title={"Nodes"}>
            <div tw={"flex flex-col gap-1"}>
                <div tw={"flex justify-between gap-2"}>
                    <div tw={"flex items-center gap-1"}>
                        <div
                            tw={"select-none flex items-center cursor-pointer"}
                            onClick={() => setExpanded((expanded) => !expanded)}
                        >
                            <FiMinus
                                size={"16px"}
                                tw={"absolute transition-opacity"}
                                style={{ opacity: expanded ? 1 : 0 }}
                            />
                            <FiPlus
                                size={"16px"}
                                tw={"absolute transition-opacity"}
                                style={{ opacity: expanded ? 0 : 1 }}
                            />
                        </div>
                        <span tw={"font-bold text-base pl-5"}>Nodes</span>
                    </div>
                    <span tw={"text-base font-mono"}>{kubeData.appScale}</span>
                </div>
                {expanded && (
                    <div tw={"flex flex-col gap-1 pl-2"}>
                        {kubeData.nodes.map((node) => (
                            <div tw={"flex gap-1 flex-col items-center"} key={node.name}>
                                <div tw={"w-full flex items-center gap-2"}>
                                    <div
                                        tw={"select-none flex items-center cursor-pointer"}
                                        onClick={() =>
                                            setEachExpanded((expanded) => ({
                                                ...expanded,
                                                [node.name]: !expanded[node.name],
                                            }))
                                        }
                                    >
                                        <FiMinus
                                            size={"16px"}
                                            tw={"absolute transition-opacity"}
                                            style={{
                                                opacity: eachExpanded[node.name] ? 1 : 0,
                                            }}
                                        />
                                        <FiPlus
                                            size={"16px"}
                                            tw={"absolute transition-opacity"}
                                            style={{
                                                opacity: eachExpanded[node.name] ? 0 : 1,
                                            }}
                                        />
                                    </div>
                                    <span tw={"font-bold text-base pl-5"}>{node.name}</span>
                                </div>
                                {eachExpanded[node.name] && (
                                    <div
                                        tw={
                                            "w-full flex flex-col text-sm ml-4 mr-4 bg-neutral-200 px-1.5 py-0.5 border border-solid border-neutral-400"
                                        }
                                    >
                                        <div tw={"flex gap-2 justify-between"}>
                                            <span tw={"font-bold"}>OS</span>
                                            <span tw={"font-mono"}>{node.osPrettyName}</span>
                                        </div>
                                        <div tw={"flex gap-2 justify-between"}>
                                            <span tw={"font-bold"}>CPUs - {node.cpus}</span>
                                            <span tw={"font-mono"}>
                                                {(node.cpuUsage / node.cpus).toFixed(2)}%
                                            </span>
                                        </div>
                                        <div tw={"flex gap-2 justify-between"}>
                                            <span tw={"font-bold"}>
                                                Memory - {Math.ceil(node.memoryMegabytes / 1024)}{" "}
                                                GiB
                                            </span>
                                            <span tw={"font-mono"}>
                                                {(
                                                    (node.memoryUsageMegabytes /
                                                        node.memoryMegabytes) *
                                                    100
                                                ).toFixed(2)}
                                                %
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </MetricsInfoBox>
    );
};
