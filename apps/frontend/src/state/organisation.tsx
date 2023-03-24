import { Snowflake } from "@kontestis/models";
import { create } from "zustand";

type OrganisationState = {
    isInitialSelect: boolean;
    isSelected: boolean;
    organisationId: Snowflake;
    setIsSelected: (_: boolean) => void;
    setIsInitialSelected: (_: boolean) => void;
    setOrganisationId: (_: Snowflake) => void;
};

export const useOrganisationStore = create<OrganisationState>((set) => ({
    isSelected: false,
    isInitialSelect: true,
    organisationId: 0n,
    setOrganisationId: (organisationId) => {
        return set({
            organisationId,
        });
    },
    setIsSelected: (newSelected) => set({ isSelected: newSelected }),
    setIsInitialSelected: (newIsInitialSelect) => set({ isInitialSelect: newIsInitialSelect }),
}));