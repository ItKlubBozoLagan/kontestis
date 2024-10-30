import { EduUser, User } from "@kontestis/models";
import { create } from "zustand";

import { useTokenStore } from "./token";

type AuthState = {
    isLoggedIn: boolean;
    user: User;
    eduUser?: EduUser;
    setIsLoggedIn: (_: boolean) => void;
    setUser: (_: User) => void;
    setEduUser: (_: EduUser) => void;

    // variable exists for forced logouts... duh
    //  error/crash/non user-initiated logout -> forceLogout = true ->
    //  in App.tsx -> listen on forceLogout change -> handle -> forceLogout = false
    forceLogout: boolean;
    doForceLogout: (value?: boolean) => void;
};

export const useAuthStore = create<AuthState>((set) => ({
    isLoggedIn: false,
    user: {} as any,
    eduUser: undefined,
    setUser: (user) => {
        return set({
            user,
        });
    },
    setEduUser: (eduUser) => {
        return set({
            eduUser,
        });
    },
    setIsLoggedIn: (newLoggedIn) => set({ isLoggedIn: newLoggedIn }),

    forceLogout: false,
    doForceLogout: (value = true) => {
        if (value) useTokenStore.getState().setToken("");

        return set({ forceLogout: value });
    },
}));
