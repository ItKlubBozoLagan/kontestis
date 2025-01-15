import { FullUser } from "@kontestis/models";
import { create } from "zustand";

import { useTokenStore } from "./token";

type AuthState = {
    isLoggedIn: boolean;
    user: FullUser;
    setIsLoggedIn: (_: boolean) => void;
    setUser: (_: FullUser) => void;

    // variable exists for forced logouts... duh
    //  error/crash/non user-initiated logout -> forceLogout = true ->
    //  in App.tsx -> listen on forceLogout change -> handle -> forceLogout = false
    forceLogout: boolean;
    doForceLogout: (value?: boolean) => void;
};

export const useAuthStore = create<AuthState>((set) => ({
    isLoggedIn: false,
    user: {} as any,
    setUser: (user) => {
        return set({
            user,
        });
    },
    setIsLoggedIn: (newLoggedIn) => set({ isLoggedIn: newLoggedIn }),

    forceLogout: false,
    doForceLogout: (value = true) => {
        if (import.meta.env.DEV) return;

        if (value) useTokenStore.getState().setToken("");

        return set({ forceLogout: value });
    },
}));
