import { Contest } from "@kontestis/models";
import React, { FC } from "react";
import { FiMonitor } from "react-icons/all";

import { ContestStatusStyleColorMap, useContestStatus } from "../../../../hooks/useContestStatus";
import { useTranslation } from "../../../../hooks/useTranslation";
import { LimitBox } from "../../../problems/ProblemViewPage";

type Properties = {
    contest: Contest;
};

export const ContestStatusBox: FC<Properties> = ({ contest }) => {
    const { status, timeFormat } = useContestStatus(contest);

    const { t } = useTranslation();

    return (
        <div tw={"w-2/5 flex self-center text-center text-xl"}>
            <LimitBox
                icon={FiMonitor}
                title={t("contests.management.individual.overview.status.label")}
                value={timeFormat}
                style={{
                    backgroundColor: ContestStatusStyleColorMap[status],
                }}
            />
        </div>
    );
};
