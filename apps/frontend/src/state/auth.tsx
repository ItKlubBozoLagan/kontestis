import { FullUser } from "@kontestis/models";
import { create } from "zustand";

type AuthState = {
    isLoggedIn: boolean;
    user: FullUser;
    setIsLoggedIn: (_: boolean) => void;
    setUser: (_: FullUser) => void;
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
}));
