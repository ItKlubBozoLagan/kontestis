import { Contest } from "@kontestis/models";
import { parseTime } from "@kontestis/utils";
import { FC, useEffect, useState } from "react";
import { FiList } from "react-icons/all";
import { Link } from "react-router-dom";

import { http } from "../../api/http";
import { TableItem, TableRow } from "../../components/Table";

type Properties = {
    contest: Contest;
    registered: boolean;
};

export const ContestListItem: FC<Properties> = ({ contest, registered }) => {
    const [time, setTime] = useState(Date.now());
    const [state, setState] = useState<"pending" | "started" | "finished">("pending");

    useEffect(() => {
        const interval = setInterval(() => setTime(Date.now()), 1000);

        if (Date.now() < contest.start_time.getTime()) setState("pending");

        if (Date.now() > contest.start_time.getTime()) setState("started");

        if (Date.now() > contest.start_time.getTime() + contest.duration_seconds * 1000)
            setState("finished");

        return () => {
            clearInterval(interval);
        };
    }, []);

    return (
        <TableRow>
            <TableItem tw={"hover:(text-sky-800 cursor-pointer)"}>
                <Link to={"/contest/" + contest.id} tw={"flex items-center gap-2"}>
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
                          contest.start_time.getTime() + contest.duration_seconds * 1000 - time
                      )
                    : parseTime(contest.duration_seconds * 1000)}
            </TableItem>
            {state != "finished" && (
                <TableItem>
                    {registered ? (
                        <span tw={"text-green-700"}>Registered</span>
                    ) : (
                        <span
                            tw={"text-red-500 hover:(text-red-700 cursor-pointer)"}
                            onClick={async () => {
                                await http.post("/contest/register/" + contest.id);
                            }}
                        >
                            Register
                        </span>
                    )}
                </TableItem>
            )}
        </TableRow>
    );
};
