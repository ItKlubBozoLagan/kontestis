import { Snowflake, Testcase } from "@kontestis/models";
import { useMutation } from "react-query";

import { http, invalidateOnSuccess, MutationHandler, wrapAxios } from "../../../../api/http";

type CreateTestcaseVariables =
    | {
          input_type: "manual";
      }
    | {
          input_type: "generator";
          output_type: "auto" | "manual";
          generator_id: string;
          generator_input: string;
      };

export const useCreateTestcase: MutationHandler<Testcase, [Snowflake, Snowflake]> = (
    [problemId, clusterId],
    options
) =>
    useMutation((variables: CreateTestcaseVariables) => {
        return variables.input_type === "generator"
            ? wrapAxios(
                  http.post(
                      `/problem/${problemId}/cluster/${clusterId}/testcase/with-generator`,
                      variables
                  )
              )
            : wrapAxios(http.post(`/problem/${problemId}/cluster/${clusterId}/testcase/`, {}));
    }, invalidateOnSuccess([["testcases", problemId, clusterId]], options));

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
