import type { AdminUserListItem, Paginated, User } from "@kontestis/models";
import { keepPreviousData, queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";

import { api } from "@/api/http";

export type UserSearchParams = {
    search: string;
    page: number;
    pageSize: number;
    sort: "name" | "email" | "newest";
};

export const userQueries = {
    /** Server-side paginated + searchable user list (site admins). */
    search: ({ search, page, pageSize, sort }: UserSearchParams) =>
        queryOptions({
            queryKey: ["users", "search", { search, page, pageSize, sort }],
            queryFn: () =>
                api.get<Paginated<AdminUserListItem>>("/auth/users", {
                    search: search || undefined,
                    limit: String(pageSize),
                    offset: String(page * pageSize),
                    sort,
                }),
            placeholderData: keepPreviousData,
        }),
    detail: (userId: bigint | string) =>
        queryOptions({
            queryKey: ["users", userId.toString()],
            queryFn: () => api.get<User>(`/auth/info/${userId}`),
            staleTime: 5 * 60_000,
        }),
};

export const useUpdateUserPermissions = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ userId, permissions }: { userId: bigint; permissions: bigint }) =>
            api.patch(`/auth/${userId}`, { permissions: permissions.toString() }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] }),
    });
};
