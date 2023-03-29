import { Snowflake } from "@kontestis/models";
import { useMutation } from "react-query";

import { http, MutationHandler, wrapAxios } from "../../api/http";

export const useSetFinalSubmission: MutationHandler<Snowflake, undefined> = (options) =>
    useMutation(
        (submissionId) => wrapAxios(http.post(`/submission/final/${submissionId}`)),
        options
    );
