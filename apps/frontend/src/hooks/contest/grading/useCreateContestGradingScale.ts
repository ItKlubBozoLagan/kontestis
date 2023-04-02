import { ExamGradingScale, Snowflake } from "@kontestis/models";
import { useMutation } from "react-query";

import { http, MutationHandler, wrapAxios } from "../../../api/http";

export type GradingScaleVariables = {
    percentage: number;
    grade: string;
};

export const useCreateContestGradingScale: MutationHandler<
    GradingScaleVariables,
    ExamGradingScale,
    Snowflake
> = (contestId, options) =>
    useMutation(
        (variables) => wrapAxios(http.post(`/contest/${contestId}/grade/`, variables)),
        options
    );

export const useModifyGradingScale: MutationHandler<
    GradingScaleVariables,
    ExamGradingScale,
    [Snowflake, Snowflake]
> = ([contestId, gradingScaleId], options) =>
    useMutation(
        (variables) =>
            wrapAxios(http.patch(`/contest/${contestId}/grade/${gradingScaleId}/`, variables)),
        options
    );

export const useDeleteGradingScale: MutationHandler<
    undefined,
    ExamGradingScale,
    [Snowflake, Snowflake]
> = ([contestId, gradingScaleId], options) =>
    useMutation(
        (variables) =>
            wrapAxios(http.delete(`/contest/${contestId}/grade/${gradingScaleId}/`, variables)),
        options
    );
