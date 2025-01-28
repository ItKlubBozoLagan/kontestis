import { Contest } from "@kontestis/models";
import { useQuery } from "react-query";

import { http, QueryHandler, wrapAxios } from "../../api/http";

export const useAllContests: QueryHandler<Contest[]> = (options) =>
    useQuery({
        queryKey: ["contests"],
        queryFn: () => wrapAxios(http.get("/contest")),
        ...options,
    });
