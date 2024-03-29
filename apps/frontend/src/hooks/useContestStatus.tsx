import { Contest } from "@kontestis/models";
import { formatDuration } from "@kontestis/utils";
import { useEffect, useState } from "react";
import { theme } from "twin.macro";

import { useTranslation } from "./useTranslation";

type ContestStatus = "pending" | "running" | "finished";

export type ContestStatusInfo =
    | {
          status: "invalid";
          timeFormat?: undefined;
      }
    | ValidContestStatusInfo;

export type ValidContestStatusInfo = {
    status: ContestStatus;
    rawTimeFormat: string;
    timeFormat: string;
};

export const ContestStatusStyleColorMap: Record<ContestStatusInfo["status"], string> = {
    pending: theme`colors.yellow.100`,
    running: theme`colors.green.100`,
    finished: theme`colors.red.100`,
    invalid: "",
};

// some disgusting generic hell here, but it makes DX better
export const useContestStatus = <
    C extends Contest | undefined,
    Return = C extends undefined ? ContestStatusInfo : ValidContestStatusInfo
>(
    contest: C
): Return => {
    const [time, setTime] = useState(Date.now());

    const endTime = !contest ? 0 : contest.start_time.getTime() + contest.duration_seconds * 1000;

    useEffect(() => {
        const interval = setInterval(() => setTime(Date.now()), 1000);

        return () => {
            clearInterval(interval);
        };
    }, []);

    const { t } = useTranslation();

    if (!contest) return { status: "invalid" } as Return;

    if (contest.start_time.getTime() > time)
        return {
            status: "pending",
            rawTimeFormat: formatDuration(contest.start_time.getTime() - time),
            timeFormat:
                t("contests.management.individual.overview.status.pending") +
                ": " +
                formatDuration(contest.start_time.getTime() - time),
        } as Return;

    if (time > endTime)
        return {
            status: "finished",
            rawTimeFormat: "",
            timeFormat: t("contests.management.individual.overview.status.finished"),
        } as Return;

    return {
        status: "running",
        rawTimeFormat: formatDuration(endTime - time),
        timeFormat:
            t("contests.management.individual.overview.status.running") +
            ": " +
            formatDuration(endTime - time),
    } as Return;
};
