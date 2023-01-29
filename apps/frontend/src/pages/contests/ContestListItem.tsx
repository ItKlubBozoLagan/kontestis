import { FC, useEffect, useState } from "react";
import { FiList } from "react-icons/all";
import { Link } from "react-router-dom";

import { TableItem, TableRow } from "../../components/Table";
import { ContestType } from "../../types/ContestType";
import { parseTime } from "../../utils/utils";

type Properties = {
    contest: ContestType;
};

export const ContestListItem: FC<Properties> = ({ contest }) => {
    const [time, setTime] = useState(Date.now());
    const [state, setState] = useState<"pending" | "started" | "finished">(
        "pending"
    );

    useEffect(() => {
        const interval = setInterval(() => setTime(Date.now()), 1000);

        if (Date.now() < contest.start_time.getTime()) setState("pending");

        if (Date.now() > contest.start_time.getTime()) setState("started");

        if (
            Date.now() >
            contest.start_time.getTime() + contest.duration_seconds * 1000
        )
            setState("finished");

        return () => {
            clearInterval(interval);
        };
    }, []);

    return (
        <TableRow>
            <TableItem tw={"hover:(text-sky-800 cursor-pointer)"}>
                <Link
                    to={"/contest/" + contest.id}
                    tw={"flex items-center gap-2"}
                >
                    <FiList tw={"text-xl"} /> {contest.name}
                </Link>
            </TableItem>
            <TableItem>{contest.start_time.toLocaleString()}</TableItem>
            <TableItem>
                {state == "pending" ? (
                    parseTime(contest.start_time.getTime() - time)
                ) : state == "started" ? (
                    <div tw={"text-green-700"}>Started</div>
                ) : (
                    <div tw={"text-red-600"}>Finished</div>
                )}
            </TableItem>
            <TableItem>
                {state == "started"
                    ? parseTime(
                          contest.start_time.getTime() +
                              contest.duration_seconds * 1000 -
                              time
                      )
                    : parseTime(contest.duration_seconds * 1000)}
            </TableItem>
        </TableRow>
    );
};
