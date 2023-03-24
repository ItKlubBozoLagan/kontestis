import { FC, useEffect } from "react";

import { PageTitle } from "../../components/PageTitle";
import { Table, TableHeadItem, TableHeadRow, TableItem, TableRow } from "../../components/Table";
import { useAllOrganisations } from "../../hooks/organisation/useAllOrganisations";
import { useOrganisationStore } from "../../state/organisation";

export const OrganisationPage: FC = () => {
    const { setIsSelected, setOrganisationId } = useOrganisationStore();

    const { data: organisations } = useAllOrganisations();

    useEffect(() => {
        if ((organisations ?? []).length !== 1) return;

        setIsSelected(true);
        setOrganisationId(organisations![0].id);
    }, [organisations]);

    return (
        <div tw={"w-full flex flex-col"}>
            <PageTitle>Organisations</PageTitle>
            <Table tw={"w-full"}>
                <thead>
                    <TableHeadRow>
                        <TableHeadItem>Name</TableHeadItem>
                    </TableHeadRow>
                </thead>
                <tbody>
                    {(organisations ?? []).map((organisation) => (
                        <TableRow key={organisation.id + ""}>
                            <TableItem
                                tw={"hover:(text-sky-800 cursor-pointer)"}
                                onClick={() => {
                                    setIsSelected(true);
                                    setOrganisationId(organisation.id);
                                }}
                            >
                                {organisation.name}
                            </TableItem>
                        </TableRow>
                    ))}
                </tbody>
            </Table>
        </div>
    );
};
