import { FC } from "react";

import { useAllOrganisations } from "../../../hooks/organisation/useAllOrganisations";
import { OrganisationTable } from "../../organisation/OrganisationsTable";

export const AdminOrganisationsPage: FC = () => {
    const { data: organisations } = useAllOrganisations();

    return (
        <div tw={"w-full"}>
            {organisations && <OrganisationTable organisations={organisations} />}
        </div>
    );
};
