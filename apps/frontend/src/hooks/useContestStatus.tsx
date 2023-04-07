import { Contest } from "@kontestis/models";
import { parseTime } from "@kontestis/utils";
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
            timeFormat:
                t("contests.management.individual.overview.status.pending") +
                ": " +
                parseTime(contest.start_time.getTime() - time),
        } as Return;

    if (time > endTime)
        return {
            status: "finished",
            timeFormat: t("contests.management.individual.overview.status.finished"),
        } as Return;

    return {
        status: "running",
        timeFormat:
            t("contests.management.individual.overview.status.running") +
            ": " +
            parseTime(endTime - time),
    } as Return;
};
