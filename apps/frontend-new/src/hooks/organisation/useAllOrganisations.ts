import { Organisation } from "@kontestis/models";
import { useQuery, useQueryClient } from "react-query";

import { http, QueryHandler, wrapAxios } from "../../api/http";

export const useAllOrganisations: QueryHandler<Organisation[]> = (options) => {
    const queryClient = useQueryClient();

    return useQuery({
        queryKey: ["organisations"],
        queryFn: () => wrapAxios(http.get("/organisation")),
        ...options,
        onSuccess: (data) => {
            for (const organisation of data)
                queryClient.setQueryData(["organisations", organisation.id], organisation);

            options?.onSuccess?.(data);
        },
    });
};
