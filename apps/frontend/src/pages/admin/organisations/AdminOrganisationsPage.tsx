import { FC } from "react";
import { useNavigate } from "react-router";

import { useAllOrganisations } from "../../../hooks/organisation/useAllOrganisations";
import { OrganisationTable } from "../../organisation/OrganisationsTable";

export const AdminOrganisationsPage: FC = () => {
    const { data: organisations } = useAllOrganisations();

    const navigate = useNavigate();

    return (
        <div tw={"w-full"}>
            {organisations && (
                <OrganisationTable
                    organisations={organisations}
                    onClick={(organisation) => navigate(`/manage/${organisation.id}`)}
                />
            )}
        </div>
    );
};
