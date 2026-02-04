import { SiteNotification } from "@kontestis/models";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { http, HttpError, wrapAxios } from "./http";

export function useNotifications() {
    return useQuery<SiteNotification[], HttpError>({
        queryKey: ["notifications"],
        queryFn: () => wrapAxios(http.get("/notifications")),
    });
}

export function useSiteAlerts() {
    const { data: notifications, ...rest } = useNotifications();

    const alerts = (notifications ?? [])
        .filter((n) => n.type === "alert")
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return { data: alerts, ...rest };
}

interface ReadNotificationsInput {
    notificationIds: string[];
}

export function useReadNotifications() {
    const queryClient = useQueryClient();

    return useMutation<void, HttpError, ReadNotificationsInput>({
        mutationFn: (data) => wrapAxios(http.post("/notifications/read", data)),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["notifications"] });
        },
    });
}
