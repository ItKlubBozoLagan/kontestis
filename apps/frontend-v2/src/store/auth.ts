import { FullUser } from "@kontestis/models";
import { create } from "zustand";

import { useTokenStore } from "./token";

interface AuthState {
    isLoggedIn: boolean;
    user: FullUser | null;
    setIsLoggedIn: (loggedIn: boolean) => void;
    setUser: (user: FullUser | null) => void;
    forceLogout: boolean;
    doForceLogout: (value?: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    isLoggedIn: false,
    user: null,
    setUser: (user) => set({ user }),
    setIsLoggedIn: (isLoggedIn) => set({ isLoggedIn }),
    forceLogout: false,
    doForceLogout: (value = true) => {
        if (value) {
            useTokenStore.getState().setToken("");
        }

        return set({ forceLogout: value });
    },
}));
