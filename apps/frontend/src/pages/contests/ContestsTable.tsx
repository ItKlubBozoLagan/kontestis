import { Contest, ContestWithPermissions } from "@kontestis/models";
import { FC } from "react";

import { Table, TableHeadItem, TableHeadRow } from "../../components/Table";
import { useTranslation } from "../../hooks/useTranslation";
import { ContestListItem } from "./ContestListItem";

type Properties = {
    contests: ContestWithPermissions[];
};

const hasStarted: (contest: Contest) => boolean = (contest) =>
    Date.now() > contest.start_time.getTime() &&
    Date.now() < contest.start_time.getTime() + contest.duration_seconds * 1000;

const hasEnded: (contest: Contest) => boolean = (contest) =>
    Date.now() > contest.start_time.getTime() + contest.duration_seconds * 1000;

export const ContestsTable: FC<Properties> = ({ contests }) => {
    const { t } = useTranslation();

    return (
        <Table>
            <thead>
                <TableHeadRow>
                    <TableHeadItem>{t("contests.table.head.name")}</TableHeadItem>
                    <TableHeadItem>{t("contests.table.head.startTime")}</TableHeadItem>
                    <TableHeadItem>{t("contests.table.head.starts.label")}</TableHeadItem>
                    <TableHeadItem>{t("contests.table.head.duration")}</TableHeadItem>
                    <TableHeadItem>{t("contests.table.head.partaking")}</TableHeadItem>
                </TableHeadRow>
            </thead>
            <tbody>
                {contests
                    .sort((a, b) => {
                        if (hasStarted(a) != hasStarted(b)) return hasStarted(a) ? -1 : 1;

                        if (hasEnded(a) != hasEnded(b)) return hasEnded(a) ? 1 : -1;

                        if (hasEnded(a)) return b.start_time.getTime() - a.start_time.getTime();

                        return a.start_time.getTime() - b.start_time.getTime();
                    })
                    .map((c) => (
                        <ContestListItem contest={c} key={c.id.toString()} />
                    ))}
            </tbody>
        </Table>
    );
};
