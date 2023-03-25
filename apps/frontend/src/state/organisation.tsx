import { Snowflake } from "@kontestis/models";
import { create } from "zustand";

type OrganisationState = {
    skipOrganisationSelect: boolean;
    isSelected: boolean;
    organisationId: Snowflake;
    setIsSelected: (_: boolean) => void;
    setSkipOrganisationSelect: (_: boolean) => void;
    setOrganisationId: (_: Snowflake) => void;
};

export const useOrganisationStore = create<OrganisationState>((set) => ({
    isSelected: false,
    skipOrganisationSelect: true,
    organisationId: 0n,
    setOrganisationId: (organisationId) => {
        return set({
            organisationId,
        });
    },
    setIsSelected: (newSelected) => set({ isSelected: newSelected }),
    setSkipOrganisationSelect: (newIsInitialSelect) =>
        set({ skipOrganisationSelect: newIsInitialSelect }),
}));
