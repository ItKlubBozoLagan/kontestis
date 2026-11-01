import { create } from "zustand";
import { persist } from "zustand/middleware";

type OrganisationState = {
    /** Selected organisation id as a decimal string, `null` when nothing is selected. */
    organisationId: string | null;
    select: (organisationId: string | bigint) => void;
    clear: () => void;
};

export const useOrganisationStore = create<OrganisationState>()(
    persist(
        (set) => ({
            organisationId: null,
            select: (organisationId) => set({ organisationId: organisationId.toString() }),
            clear: () => set({ organisationId: null }),
        }),
        { name: "@kontestis/web/organisation" }
    )
);
