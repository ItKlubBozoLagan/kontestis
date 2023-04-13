import { useMutation, useQueryClient } from "react-query";

import { http, MutationHandler, wrapAxios } from "../../api/http";

type ReadVariables = {
    notificationIds: string[];
};

export const useReadNotifications: MutationHandler<ReadVariables, undefined> = (options) => {
    const queryClient = useQueryClient();

    return useMutation((variables) => wrapAxios(http.post("/notifications/read", variables)), {
        ...options,
        onSuccess: (data, variables, context) => {
            const _ = queryClient.invalidateQueries(["notifications"]);

            options?.onSuccess?.(data, variables, context);
        },
    });
};
