import { useQuery } from "react-query";

import { http, QueryHandler, wrapAxios } from "../../api/http";
import { ContestType } from "../../types/ContestType";

export const useAllContests: QueryHandler<ContestType[]> = (options) =>
    useQuery({
        queryKey: ["contest"],
        queryFn: () => wrapAxios(http.get("/contest")),
        ...options,
    });
