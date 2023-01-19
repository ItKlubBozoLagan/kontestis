import { create } from "zustand";
import { persist } from "zustand/middleware";

import { UserType } from "../types/UserType";
import { mapFields } from "../utils/functions";

type AuthState = {
    isLoggedIn: boolean;
    token: string;
    user: UserType;
    setIsLoggedIn: (_: boolean) => void;
    setToken: (_: string) => void;
    setUser: (_: UserType) => void;
};

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            isLoggedIn: false,
            token: "",
            user: {} as any,
            setToken: (token) =>
                set((state) => ({
                    token: token,
                    user: token.length === 0 ? ({} as any) : state.user,
                    isLoggedIn: token.length === 0 ? false : state.isLoggedIn,
                })),
            setUser: (user) =>
                set({ user: mapFields(user, ["id", "permissions"], BigInt) }),
            setIsLoggedIn: (newLoggedIn) => set({ isLoggedIn: newLoggedIn }),
        }),
        {
            name: "@kontestis/auth",
        }
    )
);
