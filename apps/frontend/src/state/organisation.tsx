import { Snowflake } from "@kontestis/models";
import { create } from "zustand";
import { persist } from "zustand/middleware";

type OrganisationState = {
    skipOrganisationSelect: boolean;
    isSelected: boolean;
    organisationId: Snowflake;
    setIsSelected: (_: boolean) => void;
    setSkipOrganisationSelect: (_: boolean) => void;
    setOrganisationId: (_: Snowflake) => void;
};

export const useOrganisationStore = create<OrganisationState>()(
    persist(
        (set) => ({
            isSelected: false,
            skipOrganisationSelect: true,
            organisationId: 0n,
            setOrganisationId: (organisationId) => {
                return set({
                    organisationId,
                });
            },
            setIsSelected: (newSelected) => set({ isSelected: newSelected }),
            setSkipOrganisationSelect: (setSkipOrganisationSelect) =>
                set({ skipOrganisationSelect: setSkipOrganisationSelect }),
        }),
        { name: "@kontestis/organisation" }
    )
);
