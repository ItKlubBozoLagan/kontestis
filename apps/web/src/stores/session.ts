import { create } from "zustand";
import { persist } from "zustand/middleware";

type SessionState = {
    token: string | null;
    setToken: (token: string | null) => void;
    logout: () => void;
};

/**
 * Persisted authentication token. Everything else about the user is server state and lives in
 * TanStack Query (see `useCurrentUser`).
 */
export const useSessionStore = create<SessionState>()(
    persist(
        (set) => ({
            token: null,
            setToken: (token) => set({ token: token && token.length > 0 ? token : null }),
            logout: () => set({ token: null }),
        }),
        { name: "@kontestis/web/session" }
    )
);
