import { FC, useEffect, useState } from "react";
import { FiEdit, FiPlus } from "react-icons/all";
import { Link } from "react-router-dom";

import { PageTitle } from "../../components/PageTitle";
import { SimpleButton } from "../../components/SimpleButton";
import { Table, TableHeadItem, TableHeadRow, TableItem, TableRow } from "../../components/Table";
import { useAllOrganisations } from "../../hooks/organisation/useAllOrganisations";
import { useAuthStore } from "../../state/auth";
import { useOrganisationStore } from "../../state/organisation";
import { CreateOrganisationModal } from "./CreateOrganisationModal";

export const OrganisationPage: FC = () => {
    const { setIsSelected, setOrganisationId, isInitialSelect, setIsInitialSelected } =
        useOrganisationStore();

    const { user } = useAuthStore();

    const { data: organisations } = useAllOrganisations();

    useEffect(() => {
        if (!isInitialSelect || (organisations ?? []).length !== 1) return;

        setIsSelected(true);
        setIsInitialSelected(false);
        setOrganisationId(organisations![0].id);
    }, [organisations]);

    const [modalOpen, setModalOpen] = useState(false);

    return (
        <div tw={"w-full flex flex-col items-end gap-5"}>
            <PageTitle>Organisations</PageTitle>
            <SimpleButton prependIcon={FiPlus} onClick={() => setModalOpen(true)}>
                Create organisation
            </SimpleButton>
            <CreateOrganisationModal
                isOpen={modalOpen}
                onRequestClose={() => setModalOpen(false)}
                onAfterClose={() => setModalOpen(false)}
            />
            <Table tw={"w-full"}>
                <thead>
                    <TableHeadRow>
                        <TableHeadItem>Name</TableHeadItem>
                        <TableHeadItem>Details</TableHeadItem>
                    </TableHeadRow>
                </thead>
                <tbody>
                    {(organisations ?? [])
                        .sort((a, b) => Number(a.id) - Number(b.id))
                        .map((organisation) => (
                            <TableRow key={organisation.id + ""}>
                                <TableItem
                                    tw={"hover:(text-sky-800 cursor-pointer)"}
                                    onClick={() => {
                                        setIsSelected(true);
                                        setIsInitialSelected(false);
                                        setOrganisationId(organisation.id);
                                    }}
                                >
                                    {organisation.name}
                                </TableItem>
                                <TableItem tw={"text-xl hover:(text-sky-800 cursor-pointer)"}>
                                    {organisation.owner !== user.id ? (
                                        <></>
                                    ) : (
                                        <Link to={"/manage/" + organisation.id}>
                                            <FiEdit />
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
