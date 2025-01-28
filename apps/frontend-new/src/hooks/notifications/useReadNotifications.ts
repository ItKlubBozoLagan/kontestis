import { useMutation } from "react-query";

import { http, invalidateOnSuccess, MutationHandler, wrapAxios } from "../../api/http";

type ReadVariables = {
    notificationIds: string[];
};

export const useReadNotifications: MutationHandler<ReadVariables, undefined> = (options) => {
    return useMutation(
        (variables) => wrapAxios(http.post("/notifications/read", variables)),
        invalidateOnSuccess([["notifications"]], options)
    );
};
