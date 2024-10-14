import {
    AdminPermissions,
    hasAdminPermission,
    Organisation,
    OrganisationPermissions,
} from "@kontestis/models";
import { hasPermission } from "permissio";
import { FC } from "react";
import { FiEdit } from "react-icons/all";
import { Link } from "react-router-dom";
import tw from "twin.macro";

import { Table, TableHeadItem, TableHeadRow, TableItem, TableRow } from "../../components/Table";
import { useSelfOrganisationMembers } from "../../hooks/organisation/useSelfOrganisationMembers";
import { useTranslation } from "../../hooks/useTranslation";
import { useAuthStore } from "../../state/auth";

type Properties = {
    organisations: Organisation[];
    onClick?: (o: Organisation) => void;
};

export const OrganisationTable: FC<Properties> = ({ organisations, onClick }) => {
    const { t } = useTranslation();
    const { user } = useAuthStore();

    const { data: members } = useSelfOrganisationMembers();

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
                                tw={"hover:text-sky-800 w-full"}
                                css={onClick ? tw`cursor-pointer` : ""}
                                onClick={() => {
                                    onClick?.(organisation);
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
                                    ) &&
                                    !(members ?? []).some(
                                        (m) =>
                                            m.organisation_id === organisation.id &&
                                            (hasPermission(
                                                m.permissions,
                                                OrganisationPermissions.VIEW_USER
                                            ) ||
                                                hasPermission(
                                                    m.permissions,
                                                    OrganisationPermissions.ADMIN
                                                ))
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
