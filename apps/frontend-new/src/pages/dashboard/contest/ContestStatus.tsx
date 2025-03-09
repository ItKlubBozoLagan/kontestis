import { formatDuration } from "@kontestis/utils";
import { FC, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { useInterval } from "@/hooks/useInterval";

import { Contest } from "../../../../../../packages/models";

type Properties = {
    contest: Contest;
};

export const ContestStatus: FC<Properties> = ({ contest }) => {
    const [currentTime, setCurrentTime] = useState(Date.now());

    useInterval(() => {
        setCurrentTime(Date.now());
    }, 1000);

    if (contest.start_time.getTime() > currentTime)
        return (
            <Badge className={"flex gap-2"} variant={"pending"}>
                <span>Starts in:</span>
                <span>{formatDuration(contest.start_time.getTime() - currentTime)}</span>
            </Badge>
        );

    if (contest.start_time.getTime() + contest.duration_seconds * 1000 > currentTime)
        return (
            <Badge className={"flex gap-2"} variant={"running"}>
                <span>Running: </span>
                <span>
                    {formatDuration(
                        contest.start_time.getTime() + contest.duration_seconds * 1000 - currentTime
                    )}
                </span>
            </Badge>
        );

    return (
        <Badge variant={"finished"}>
            <span>Finished</span>
        </Badge>
    );
};
