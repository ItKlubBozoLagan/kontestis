import { DEFAULT_ELO, OrganisationMember, Snowflake } from "@kontestis/models";
import { useCallback, useMemo } from "react";
import { useQuery } from "react-query";

import { http, QueryHandler, wrapAxios } from "@/api/http";
import { useAuthStore } from "@/state/auth";

export const useOrganisationMemberElo: QueryHandler<number, Snowflake> = (memberId, options) => {
    // TODO: organisation
    const { organisationId } = { organisationId: 1 };

    const queryFunction = useCallback(
        () =>
            wrapAxios<OrganisationMember>(
                http.get(`/organisation/${organisationId}/member/${memberId}`)
            ).then((data) => data.elo),
        [organisationId]
    );

    return useQuery({
        queryKey: ["organisation", organisationId, "member", memberId, "elo"],
        queryFn: queryFunction,
        ...options,
    });
};

export const useElo = () => {
    const { user } = useAuthStore();

    const { data: eloData } = useOrganisationMemberElo(user.id);

    return useMemo(() => eloData ?? DEFAULT_ELO, [eloData]);
};
