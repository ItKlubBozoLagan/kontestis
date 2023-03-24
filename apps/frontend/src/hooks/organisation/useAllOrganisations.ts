import { Organisation } from "@kontestis/models";
import { useQuery } from "react-query";

import { http, QueryHandler, wrapAxios } from "../../api/http";

export const useAllOrganisations: QueryHandler<Organisation[]> = (options) =>
    useQuery({
        queryKey: ["organisations"],
        queryFn: () => wrapAxios(http.get("/organisation")),
        ...options,
    });
