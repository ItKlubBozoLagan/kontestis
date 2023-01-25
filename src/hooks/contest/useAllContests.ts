import { useQuery } from "react-query";

import { http, QueryHandler, wrapAxios } from "../../api/http";
import { ContestType } from "../../types/ContestType";

export const useAllContests: QueryHandler<ContestType[]> = () =>
    useQuery(["contest"], () => wrapAxios(http.get("/contest")));
