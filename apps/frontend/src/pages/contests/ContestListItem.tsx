import { ContestWithPermissions } from "@kontestis/models";
import { cutText, parseTime, toCroatianLocale } from "@kontestis/utils";
import { FC, useEffect, useState } from "react";
import { FiCheck, FiList, FiX } from "react-icons/all";
import { useQueryClient } from "react-query";
import { Link } from "react-router-dom";

import { http } from "../../api/http";
import { TableItem, TableRow } from "../../components/Table";

type Properties = {
    contest: ContestWithPermissions;
    adminView?: boolean;
};

export const ContestListItem: FC<Properties> = ({ contest, adminView }) => {
    const [time, setTime] = useState(Date.now());
    const [state, setState] = useState<"pending" | "started" | "finished">("pending");

    const [registered, setRegistered] = useState(contest.registered);

    const queryClient = useQueryClient();

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
                <Link
                    to={(!adminView ? "/contest/" : "") + contest.id}
                    tw={"flex items-center gap-2"}
                >
                    <FiList tw={"text-xl"} /> {cutText(contest.name, 32)}
                </Link>
            </TableItem>
            <TableItem>{toCroatianLocale(contest.start_time)}</TableItem>
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
            {!adminView && (
                <TableItem>
                    {state != "finished" ? (
                        registered ? (
                            <span tw={"text-green-700"}>Registered</span>
                        ) : (
                            <span
                                tw={"text-yellow-600 hover:(text-yellow-700 cursor-pointer)"}
                                onClick={async () => {
                                    await http
                                        .post("/contest/register/" + contest.id)
                                        .then(() =>
                                            queryClient.invalidateQueries([
                                                "contests",
                                                "members",
                                                "self",
                                            ])
                                        )
                                        .then(() => setRegistered(true));
                                }}
                            >
                                Register
                            </span>
                        )
                    ) : (
                        <div tw={"flex items-center"}>
                            {registered ? (
                                <FiCheck tw={"text-green-600"} size={"16px"} />
                            ) : (
                                <FiX tw={"text-red-400"} size={"18px"} />
                            )}
                        </div>
                    )}
                </TableItem>
            )}
        </TableRow>
    );
};
