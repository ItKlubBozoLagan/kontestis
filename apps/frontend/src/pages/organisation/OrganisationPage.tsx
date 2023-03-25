import { FC, useEffect, useState } from "react";
import { FiEdit, FiPlus } from "react-icons/all";

import { PageTitle } from "../../components/PageTitle";
import { SimpleButton } from "../../components/SimpleButton";
import { Table, TableHeadItem, TableHeadRow, TableItem, TableRow } from "../../components/Table";
import { useAllOrganisations } from "../../hooks/organisation/useAllOrganisations";
import { useOrganisationStore } from "../../state/organisation";
import { CreateOrganisationModal } from "./CreateOrganisationModal";

export const OrganisationPage: FC = () => {
    const { setIsSelected, setOrganisationId, isInitialSelect, setIsInitialSelected } =
        useOrganisationStore();

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
                    {(organisations ?? []).map((organisation) => (
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
                                <FiEdit />
                            </TableItem>
                        </TableRow>
                    ))}
                </tbody>
            </Table>
        </div>
    );
};
