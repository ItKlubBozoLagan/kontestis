import { Organisation, OrganisationMember } from "@kontestis/models";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { http, HttpError, wrapAxios } from "./http";

export function useAllOrganisations() {
    return useQuery<Organisation[], HttpError>({
        queryKey: ["organisations"],
        queryFn: () => wrapAxios(http.get("/organisation")),
    });
}

export function useOrganisation(organisationId: bigint) {
    return useQuery<Organisation, HttpError>({
        queryKey: ["organisations", organisationId.toString()],
        queryFn: () => wrapAxios(http.get(`/organisation/${organisationId}`)),
        enabled: organisationId !== 0n,
    });
}

export function useSelfOrganisationMembers() {
    return useQuery<OrganisationMember[], HttpError>({
        queryKey: ["organisations", "self", "members"],
        queryFn: () => wrapAxios(http.get("/organisation/self/member")),
    });
}

interface CreateOrganisationInput {
    name: string;
}

export function useCreateOrganisation() {
    const queryClient = useQueryClient();

    return useMutation<Organisation, HttpError, CreateOrganisationInput>({
        mutationFn: (data) => wrapAxios(http.post("/organisation", data)),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["organisations"] });
        },
    });
}
