import { KubernetesSystemMetrics } from "@kontestis/models";
import { cutText } from "@kontestis/utils";
import { FC, useState } from "react";
import { FiMinus, FiPlus } from "react-icons/all";

import { useTranslation } from "../../../../../../hooks/useTranslation";
import { MetricsInfoBox } from "./MetricsInfoBox";

type Properties = {
    kubeData: KubernetesSystemMetrics["kubeData"];
};

export const PodsBox: FC<Properties> = ({ kubeData }) => {
    const [expanded, setExpanded] = useState(false);

    const { t } = useTranslation();

    return (
        <MetricsInfoBox title={t("admin.overview.metrics.kubernetes.pods.title")}>
            <div tw={"flex flex-col gap-1"}>
                <div tw={"flex justify-between gap-2"}>
                    <div tw={"flex items-center gap-1"}>
                        <div
                            tw={"select-none flex items-center cursor-pointer"}
                            onClick={() => setExpanded((previous) => !previous)}
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
                        <span tw={"font-bold text-base pl-5"}>
                            {t("admin.overview.metrics.kubernetes.pods.label")}
                        </span>
                    </div>
                    <span tw={"text-base font-mono"}>{kubeData.appScale}</span>
                </div>
                {expanded && (
                    <div tw={"flex flex-col pl-2"}>
                        {kubeData.sisterPodNames.map((it) => (
                            <span key={it} tw={"text-base"}>
                                {cutText(it, 22)}
                            </span>
                        ))}
                    </div>
                )}
            </div>
        </MetricsInfoBox>
    );
};
