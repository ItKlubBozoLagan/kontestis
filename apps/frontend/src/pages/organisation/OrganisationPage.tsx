import { FC, useEffect, useState } from "react";
import { FiEdit, FiPlus } from "react-icons/all";
import { Link } from "react-router-dom";

import { PageTitle } from "../../components/PageTitle";
import { SimpleButton } from "../../components/SimpleButton";
import { Table, TableHeadItem, TableHeadRow, TableItem, TableRow } from "../../components/Table";
import { useAllOrganisations } from "../../hooks/organisation/useAllOrganisations";
import { useTranslation } from "../../hooks/useTranslation";
import { useAuthStore } from "../../state/auth";
import { useOrganisationStore } from "../../state/organisation";
import { CreateOrganisationModal } from "./CreateOrganisationModal";

export const OrganisationPage: FC = () => {
    const { setIsSelected, setOrganisationId, skipOrganisationSelect, setSkipOrganisationSelect } =
        useOrganisationStore();

    const { user } = useAuthStore();

    const { data: organisations } = useAllOrganisations();

    useEffect(() => {
        if (!skipOrganisationSelect || (organisations ?? []).length !== 1) return;

        setIsSelected(true);
        setSkipOrganisationSelect(false);
        setOrganisationId(organisations![0].id);
    }, [organisations]);

    const [modalOpen, setModalOpen] = useState(false);

    const { t } = useTranslation();

    return (
        <div tw={"w-full flex flex-col items-end gap-5"}>
            <PageTitle>{t("organisations.page.title")}</PageTitle>
            <SimpleButton prependIcon={FiPlus} onClick={() => setModalOpen(true)}>
                {t("organisations.page.createButton")}
            </SimpleButton>
            <CreateOrganisationModal
                isOpen={modalOpen}
                onRequestClose={() => setModalOpen(false)}
                onAfterClose={() => setModalOpen(false)}
            />
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
                                    onClick={async () => {
                                        setIsSelected(true);
                                        setOrganisationId(organisation.id);
                                        setSkipOrganisationSelect(false);
                                    }}
                                >
                                    {organisation.name}
                                </TableItem>
                                <TableItem tw={"cursor-pointer hover:text-sky-800"}>
                                    {organisation.owner !== user.id ? (
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
        </div>
    );
};
