import type { OrganisationOverview } from "@kontestis/models";
import { queryOptions } from "@tanstack/react-query";

import { api } from "@/api/http";

export const adminQueries = {
    /** Every organisation with owner name, member and contest counts (site admins). */
    organisationOverview: () =>
        queryOptions({
            queryKey: ["organisations", "admin-overview"],
            queryFn: () => api.get<OrganisationOverview[]>("/organisation/overview"),
        }),
};
