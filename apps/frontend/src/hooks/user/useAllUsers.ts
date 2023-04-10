import { FullUser } from "@kontestis/models";
import { useQuery } from "react-query";

import { http, QueryHandler, wrapAxios } from "../../api/http";

export const useAllUsers: QueryHandler<FullUser[]> = (options) =>
    useQuery({
        queryKey: ["users"],
        queryFn: () => wrapAxios(http.get("/auth/")),
        ...options,
    });
