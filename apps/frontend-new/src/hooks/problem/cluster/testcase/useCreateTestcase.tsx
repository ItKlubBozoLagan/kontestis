import { Snowflake, Testcase } from "@kontestis/models";
import { useMutation } from "react-query";

import { http, invalidateOnSuccess, MutationHandler, wrapAxios } from "../../../../api/http";

type CreateTestcaseVariables = {
    input: string;
};

export const useCreateTestcase: MutationHandler<
    CreateTestcaseVariables,
    Testcase,
    [Snowflake, Snowflake]
> = ([problemId, clusterId], options) =>
    useMutation(
        (variables) =>
            wrapAxios(http.post(`/problem/${problemId}/cluster/${clusterId}/testcase/`, variables)),
        invalidateOnSuccess([["testcases", problemId, clusterId]], options)
    );

export const useModifyTestcase: MutationHandler<
    CreateTestcaseVariables,
    Testcase,
    [Snowflake, Snowflake, Snowflake]
> = ([problemId, clusterId, testcaseId], options) =>
    useMutation(
        (variables) =>
            wrapAxios(
                http.patch(
                    `/problem/${problemId}/cluster/${clusterId}/testcase/${testcaseId}`,
                    variables
                )
            ),
        invalidateOnSuccess(
            [
                ["testcases", problemId, testcaseId],
                ["problem", problemId, "cluster", clusterId, "testcase", testcaseId],
            ],
            options
        )
    );
