import { AdminPermissions, hasAdminPermission, Organisation } from "@kontestis/models";
import { FC } from "react";
import { FiEdit } from "react-icons/all";
import { Link } from "react-router-dom";

import { Table, TableHeadItem, TableHeadRow, TableItem, TableRow } from "../../components/Table";
import { useTranslation } from "../../hooks/useTranslation";
import { useAuthStore } from "../../state/auth";

type Properties = {
    organisations: Organisation[];
    clickFunc?: (o: Organisation) => void;
};

export const OrganisationTable: FC<Properties> = ({ organisations, clickFunc }) => {
    const { t } = useTranslation();
    const { user } = useAuthStore();

    return (
        <Table tw={"w-full"}>
            <thead>
                <TableHeadRow>
                    <TableHeadItem>{t("organisations.page.table.name")}</TableHeadItem>
                    <TableHeadItem>{t("organisations.page.table.details")}</TableHeadItem>
                </TableHeadRow>
            </thead>
            <tbody>
                {(organisations ?? [])
                    .sort((a, b) => Number(a.id) - Number(b.id))
                    .map((organisation) => (
                        <TableRow key={organisation.id + ""}>
                            <TableItem
                                tw={"cursor-pointer hover:text-sky-800 w-full"}
                                onClick={() => {
                                    if (clickFunc) clickFunc(organisation);
                                }}
                            >
                                {organisation.name}
                            </TableItem>
                            <TableItem tw={"cursor-pointer hover:text-sky-800"}>
                                {organisation.id === 1n ||
                                (organisation.owner !== user.id &&
                                    !hasAdminPermission(
                                        user.permissions,
                                        AdminPermissions.EDIT_ORGANISATIONS
                                    )) ? (
                                    <></>
                                ) : (
                                    <Link
                                        to={"/manage/" + organisation.id}
                                        tw={"flex items-center"}
                                    >
                                        <FiEdit size={"18px"} />
                                    </Link>
                                )}
                            </TableItem>
                        </TableRow>
                    ))}
            </tbody>
        </Table>
    );
};
