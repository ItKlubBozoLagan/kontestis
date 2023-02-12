import { Snowflake, Testcase } from "@kontestis/models";
import { useMutation } from "react-query";

import { http, MutationHandler, wrapAxios } from "../../api/http";

type CreateTestcaseVariables = {
    input: string;
    correctOutput: string;
};

export const useCreateTestcase: MutationHandler<CreateTestcaseVariables, Testcase, Snowflake> = (
    clusterId,
    options
) =>
    useMutation(
        (variables) => wrapAxios(http.post("/problem/testcase/" + clusterId, variables)),
        options
    );
