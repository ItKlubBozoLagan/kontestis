import { Snowflake } from "@kontestis/models";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface OrganisationState {
    skipOrganisationSelect: boolean;
    isSelected: boolean;
    organisationId: Snowflake;
    setIsSelected: (selected: boolean) => void;
    setSkipOrganisationSelect: (skip: boolean) => void;
    setOrganisationId: (id: Snowflake) => void;
    reset: () => void;
}

export const ORGANISATION_STORE_KEY = "@kontestis/organisation-v2";

export const useOrganisationStore = create<OrganisationState>()(
    persist(
        (set) => ({
            isSelected: false,
            skipOrganisationSelect: true,
            organisationId: 0n,
            setOrganisationId: (organisationId) => set({ organisationId }),
            setIsSelected: (isSelected) => set({ isSelected }),
            setSkipOrganisationSelect: (skipOrganisationSelect) => set({ skipOrganisationSelect }),
            reset: () =>
                set({
                    isSelected: false,
                    skipOrganisationSelect: true,
                    organisationId: 0n,
                }),
        }),
        {
            name: ORGANISATION_STORE_KEY,
            // Custom serialization for BigInt
            storage: {
                getItem: (name) => {
                    const string_ = localStorage.getItem(name);

                    if (!string_) return null;

                    const parsed = JSON.parse(string_);

                    if (parsed.state?.organisationId) {
                        parsed.state.organisationId = BigInt(parsed.state.organisationId);
                    }

                    return parsed;
                },
                setItem: (name, value) => {
                    const serialized = JSON.stringify(value, (_, v) =>
                        typeof v === "bigint" ? v.toString() : v
                    );

                    localStorage.setItem(name, serialized);
                },
                removeItem: (name) => localStorage.removeItem(name),
            },
        }
    )
);
