import { ContestWithPermissions } from "@kontestis/models";
import { cutText, formatDuration, toCroatianLocale } from "@kontestis/utils";
import { FC, useState } from "react";
import { FiCheck, FiList, FiX } from "react-icons/all";
import { useQueryClient } from "react-query";
import { Link } from "react-router-dom";

import { http } from "../../api/http";
import { TableItem, TableRow } from "../../components/Table";
import { useContestStatus } from "../../hooks/useContestStatus";
import { useTranslation } from "../../hooks/useTranslation";

type Properties = {
    contest: ContestWithPermissions;
    adminView?: boolean;
};

export const ContestListItem: FC<Properties> = ({ contest, adminView }) => {
    const [registered, setRegistered] = useState(contest.registered);

    const { status, rawTimeFormat } = useContestStatus(contest);

    const queryClient = useQueryClient();

    const { t } = useTranslation();

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
                {status === "pending" ? (
                    rawTimeFormat
                ) : status === "running" ? (
                    <div tw={"text-green-700"}>{t("contests.table.body.starts.started")}</div>
                ) : (
                    <div tw={"text-red-600"}>{t("contests.table.body.starts.finished")}</div>
                )}
            </TableItem>
            <TableItem>
                {status === "running"
                    ? rawTimeFormat
                    : formatDuration(contest.duration_seconds * 1000)}
            </TableItem>
            {!adminView && (
                <TableItem>
                    {status !== "finished" ? (
                        registered ? (
                            <span tw={"text-green-700"}>
                                {t("contests.table.body.registered.registered")}
                            </span>
                        ) : (
                            <span
                                tw={"text-yellow-600 hover:(text-yellow-700 cursor-pointer)"}
                                onClick={async () => {
                                    // TODO: mutations
                                    await http
                                        .post("/contest/" + contest.id + "/members/register/")
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
                                {t("contests.table.body.registered.notRegistered")}
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
