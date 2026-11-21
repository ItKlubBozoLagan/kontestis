import type {
    Organisation,
    OrganisationMember,
    OrganisationMemberWithInfo,
} from "@kontestis/models";
import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/api/http";
import { useOrganisationStore } from "@/stores/organisation";

export const organisationQueries = {
    all: () =>
        queryOptions({
            queryKey: ["organisations"],
            queryFn: () => api.get<Organisation[]>("/organisation"),
        }),
    detail: (organisationId: string | bigint) =>
        queryOptions({
            queryKey: ["organisations", organisationId.toString()],
            queryFn: () => api.get<Organisation>(`/organisation/${organisationId}`),
        }),
    members: (organisationId: string | bigint) =>
        queryOptions({
            queryKey: ["organisations", organisationId.toString(), "members"],
            queryFn: () =>
                api.get<OrganisationMemberWithInfo[]>(`/organisation/${organisationId}/member`),
        }),
    selfMemberships: () =>
        queryOptions({
            queryKey: ["organisations", "memberships", "self"],
            queryFn: () => api.get<OrganisationMember[]>("/organisation/members/self"),
        }),
};

/** Membership of the logged in user in the currently selected organisation (if any). */
export const useCurrentOrganisationMembership = () => {
    const organisationId = useOrganisationStore((state) => state.organisationId);

    return useQuery({
        ...organisationQueries.selfMemberships(),
        select: (memberships) =>
            memberships.find((it) => it.organisation_id.toString() === organisationId) ?? null,
    });
};

export const useCreateOrganisation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (body: { name: string }) => api.post<Organisation>("/organisation", body),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["organisations"] }),
        meta: { silent: true },
    });
};

export const useRenameOrganisation = (organisationId: bigint) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (body: { name: string }) => api.patch(`/organisation/${organisationId}`, body),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["organisations"] }),
        meta: { silent: true },
    });
};

export const useAddOrganisationMember = (organisationId: bigint) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (body: { email: string }) =>
            api.post<OrganisationMember>(`/organisation/${organisationId}/member`, body),
        onSuccess: () =>
            queryClient.invalidateQueries({
                queryKey: organisationQueries.members(organisationId).queryKey,
            }),
        meta: { silent: true },
    });
};

export const useUpdateOrganisationMember = (organisationId: bigint) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ userId, ...body }: { userId: bigint; permissions: bigint; elo: number }) =>
            api.patch(`/organisation/${organisationId}/member/${userId}`, {
                permissions: body.permissions.toString(),
                elo: body.elo,
            }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["organisations"] }),
    });
};

export const useRemoveOrganisationMember = (organisationId: bigint) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (userId: bigint) =>
            api.delete(`/organisation/${organisationId}/member/${userId}`),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["organisations"] }),
    });
};
