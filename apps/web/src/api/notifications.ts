import type { SiteNotification } from "@kontestis/models";
import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";

import { api } from "@/api/http";

export const notificationQueries = {
    all: () =>
        queryOptions({
            queryKey: ["notifications"],
            queryFn: () => api.get<SiteNotification[]>("/notifications"),
            refetchInterval: 30_000,
        }),
};

export const useMarkNotificationsRead = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (ids: bigint[]) =>
            api.post("/notifications/read", { notificationIds: ids.map(String) }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
    });
};

export const useCreateAlert = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (message: string) => api.post("/notifications/alert", { message }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
    });
};

export const useSendMail = () =>
    useMutation({
        mutationFn: (body: {
            subject: string;
            text: string;
            contestAnnouncement: boolean;
            debugMode: boolean;
        }) => api.post("/notifications/sendMail", body),
    });
