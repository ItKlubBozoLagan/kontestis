import { Contest } from "@kontestis/models";
import { parseTime } from "@kontestis/utils";
import React, { FC, useEffect, useState } from "react";
import { FiMonitor } from "react-icons/all";

import { useTranslation } from "../../../../hooks/useTranslation";
import { LimitBox } from "../../../problems/ProblemViewPage";

type Properties = {
    contest: Contest;
};

export const ContestStatusIndicator: FC<Properties> = ({ contest }) => {
    const [time, setTime] = useState(Date.now());

    const endTime = contest.start_time.getTime() + contest.duration_seconds * 1000;

    useEffect(() => {
        const interval = setInterval(() => setTime(Date.now()), 1000);

        return () => {
            clearInterval(interval);
        };
    }, []);

    const { t } = useTranslation();

    return (
        <div tw={"w-2/5 flex self-center text-center text-xl"}>
            {contest.start_time.getTime() > time ? (
                <LimitBox
                    icon={FiMonitor}
                    title={t("contests.management.individual.overview.status.label")}
                    value={
                        t("contests.management.individual.overview.status.pending") +
                        ":" +
                        parseTime(contest.start_time.getTime() - time)
                    }
                    tw={"bg-yellow-100"}
                />
            ) : time > endTime ? (
                <LimitBox
                    icon={FiMonitor}
                    title={t("contests.management.individual.overview.status.label")}
                    value={t("contests.management.individual.overview.status.finished")}
                    tw={"bg-red-100"}
                />
            ) : (
                <LimitBox
                    icon={FiMonitor}
                    title={t("contests.management.individual.overview.status.label")}
                    value={
                        t("contests.management.individual.overview.status.running") +
                        ":" +
                        parseTime(endTime - time)
                    }
                    tw={"bg-green-100"}
                />
            )}
        </div>
    );
};
