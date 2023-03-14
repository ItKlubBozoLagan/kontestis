import { ContestWithPermissions } from "@kontestis/models";
import { FC } from "react";

import { Table, TableHeadItem, TableHeadRow } from "../../components/Table";
import { ContestListItem } from "./ContestListItem";

type Properties = {
    contests: ContestWithPermissions[];
};

export const ContestsTable: FC<Properties> = ({ contests }) => {
    return (
        <Table>
            <thead>
                <TableHeadRow>
                    <TableHeadItem>Name</TableHeadItem>
                    <TableHeadItem>Start time</TableHeadItem>
                    <TableHeadItem>Starts</TableHeadItem>
                    <TableHeadItem>Duration</TableHeadItem>
                    <TableHeadItem>Partaking</TableHeadItem>
                </TableHeadRow>
            </thead>
            <tbody>
                {contests.map((c) => (
                    <ContestListItem contest={c} key={c.id.toString()} />
                ))}
            </tbody>
        </Table>
    );
};
