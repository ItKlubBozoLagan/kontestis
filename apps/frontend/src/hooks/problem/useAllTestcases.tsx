import { Testcase } from "@kontestis/models";
import { Snowflake } from "@kontestis/models";
import { useQuery } from "react-query";

import { http, QueryHandler, wrapAxios } from "../../api/http";

export const useAllTestcases: QueryHandler<Testcase[], Snowflake> = (problemId, options) =>
    useQuery({
        queryKey: ["testcases", problemId],
        queryFn: () => wrapAxios(http.get("/problem/testcase/" + problemId)),
        ...options,
    });
