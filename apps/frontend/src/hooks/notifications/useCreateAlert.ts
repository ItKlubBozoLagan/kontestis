import { useMutation } from "react-query";

import { http, MutationHandler, wrapAxios } from "../../api/http";

type AlertVariables = {
    message: string;
};

export const useCreateAlert: MutationHandler<AlertVariables, undefined> = (options) =>
    useMutation((variables) => wrapAxios(http.post("/notifications/alert", variables)), options);
