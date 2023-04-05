import { DEFAULT_ELO, Snowflake } from "@kontestis/models";
import { create } from "zustand";
import { persist } from "zustand/middleware";

type OrganisationState = {
    skipOrganisationSelect: boolean;
    isSelected: boolean;
    organisationId: Snowflake;
    elo: number;
    setElo: (_: number) => void;
    setIsSelected: (_: boolean) => void;
    setSkipOrganisationSelect: (_: boolean) => void;
    setOrganisationId: (_: Snowflake) => void;
    reset: () => void;
};

export const ORGANISATION_STORE_KEY = "@kontestis/organisation";

export const useOrganisationStore = create<OrganisationState>()(
    persist(
        (set) => ({
            isSelected: false,
            skipOrganisationSelect: true,
            organisationId: 0n,
            elo: DEFAULT_ELO,
            setElo: (elo) => {
                return set({
                    elo,
                });
            },
            setOrganisationId: (organisationId) => {
                return set({
                    organisationId,
                });
            },
            setIsSelected: (newSelected) => set({ isSelected: newSelected }),
            setSkipOrganisationSelect: (setSkipOrganisationSelect) =>
                set({ skipOrganisationSelect: setSkipOrganisationSelect }),
            reset: () =>
                set({ isSelected: false, skipOrganisationSelect: true, organisationId: 0n }),
        }),
        { name: ORGANISATION_STORE_KEY }
    )
);
