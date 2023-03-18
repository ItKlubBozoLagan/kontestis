import { Contest } from "@kontestis/models";
import { parseTime } from "@kontestis/utils";
import React, { FC, useEffect, useState } from "react";
import { FiMonitor } from "react-icons/all";

import { LimitBox } from "../../../problems/ProblemViewPage";

type Properties = {
    contest: Contest;
};

export const ContestStatusIndicator: FC<Properties> = ({ contest }) => {
    const [time, setTime] = useState(Date.now());

    useEffect(() => {
        const interval = setInterval(() => setTime(Date.now()), 1000);

        return () => {
            clearInterval(interval);
        };
    }, []);

    return (
        <div tw={"w-2/5 flex self-center text-center text-xl"}>
            {contest.start_time.getTime() > Date.now() ? (
                <LimitBox
                    icon={FiMonitor}
                    title={"Status"}
                    value={"Starts in: " + parseTime(contest.start_time.getTime() - time)}
                    tw={"bg-yellow-100"}
                />
            ) : time > contest.start_time.getTime() + contest.duration_seconds * 1000 ? (
                <LimitBox icon={FiMonitor} title={"Status"} value={"Finished"} tw={"bg-red-100"} />
            ) : (
                <LimitBox
                    icon={FiMonitor}
                    title={"Status"}
                    value={
                        "Running: " +
                        parseTime(
                            contest.start_time.getTime() + contest.duration_seconds * 1000 - time
                        )
                    }
                    tw={"bg-green-100"}
                />
            )}
        </div>
    );
};
